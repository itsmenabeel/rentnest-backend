import { PaymentStatus, Prisma, RentalRequestStatus, Role } from '@prisma/client';
import SSLCommerzPayment = require('sslcommerz-lts');
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { ConfirmPaymentBody, CreatePaymentBody } from './payments.validation';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
} satisfies Prisma.UserSelect;

const paymentInclude = {
  rentalRequest: {
    include: {
      tenant: { select: userSelect },
      property: {
        include: {
          category: true,
          landlord: { select: userSelect },
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

function getSSLCommerzClient() {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw ApiError.internal('SSLCommerz is not configured');
  }

  return new SSLCommerzPayment(
    env.SSLCOMMERZ_STORE_ID,
    env.SSLCOMMERZ_STORE_PASSWORD,
    env.SSLCOMMERZ_IS_LIVE
  );
}

function makeTransactionId(rentalRequestId: string) {
  return `RN-${rentalRequestId.slice(0, 8)}-${Date.now()}`;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function isSuccessfulValidation(response: Record<string, unknown>) {
  const status = getString(response.status)?.toUpperCase();
  return status === 'VALID' || status === 'VALIDATED';
}

function assertPaymentAccess(
  payment: Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>,
  user: { id: string; role: Role }
) {
  if (user.role === 'TENANT' && payment.rentalRequest.tenantId === user.id) return;
  if (user.role === 'LANDLORD' && payment.rentalRequest.property.landlordId === user.id) return;
  if (user.role === 'ADMIN') return;
  throw ApiError.forbidden('You do not have access to this payment');
}

export const paymentsService = {
  async create(input: CreatePaymentBody, tenantId: string) {
    const rental = await prisma.rentalRequest.findUnique({
      where: { id: input.rentalRequestId },
      include: {
        tenant: true,
        property: {
          include: {
            category: true,
          },
        },
        payment: true,
      },
    });

    if (!rental) {
      throw ApiError.notFound('Rental request not found');
    }

    if (rental.tenantId !== tenantId) {
      throw ApiError.forbidden('You can only pay for your own rental requests');
    }

    if (rental.status !== RentalRequestStatus.APPROVED) {
      throw ApiError.badRequest('Payment can only be created for approved rental requests');
    }

    if (rental.payment?.status === PaymentStatus.COMPLETED) {
      throw ApiError.conflict('This rental request has already been paid');
    }

    const amount = Number(rental.property.price);
    const transactionId = makeTransactionId(rental.id);

    const payment = await prisma.payment.upsert({
      where: { rentalRequestId: rental.id },
      update: {
        transactionId,
        amount,
        status: PaymentStatus.PENDING,
        paidAt: null,
      },
      create: {
        rentalRequestId: rental.id,
        transactionId,
        amount,
        status: PaymentStatus.PENDING,
      },
      include: paymentInclude,
    });

    const callbackBase = `${env.API_BASE_URL}/api/payments`;
    const sslcz = getSSLCommerzClient();
    const session = await sslcz.init({
      total_amount: amount,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${callbackBase}/confirm`,
      fail_url: `${callbackBase}/confirm`,
      cancel_url: `${callbackBase}/confirm`,
      ipn_url: `${callbackBase}/ipn`,
      shipping_method: 'NO',
      product_name: rental.property.title,
      product_category: rental.property.category.name,
      product_profile: 'non-physical-goods',
      cus_name: rental.tenant.name,
      cus_email: rental.tenant.email,
      cus_add1: rental.property.location,
      cus_add2: rental.property.location,
      cus_city: rental.property.location,
      cus_state: rental.property.location,
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: rental.tenant.phone ?? '01700000000',
      cus_fax: rental.tenant.phone ?? '01700000000',
      ship_name: rental.tenant.name,
      ship_add1: rental.property.location,
      ship_add2: rental.property.location,
      ship_city: rental.property.location,
      ship_state: rental.property.location,
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
    });

    return {
      payment,
      gatewayUrl: getString(session.GatewayPageURL),
      session,
    };
  },

  async confirm(input: ConfirmPaymentBody) {
    const sslcz = getSSLCommerzClient();
    const validation = await sslcz.validate({ val_id: input.val_id });
    const transactionId = input.tran_id ?? getString(validation.tran_id);

    if (!transactionId) {
      throw ApiError.badRequest('Transaction id was not returned by SSLCommerz');
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: paymentInclude,
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found for this transaction');
    }

    if (!isSuccessfulValidation(validation)) {
      const failedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
        include: paymentInclude,
      });

      return {
        payment: failedPayment,
        validation,
      };
    }

    const completedPayment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
        include: paymentInclude,
      });

      await tx.rentalRequest.update({
        where: { id: payment.rentalRequestId },
        data: { status: RentalRequestStatus.ACTIVE },
      });

      await tx.property.update({
        where: { id: payment.rentalRequest.propertyId },
        data: { isAvailable: false },
      });

      return updatedPayment;
    });

    return {
      payment: completedPayment,
      validation,
    };
  },

  async getHistory(tenantId: string) {
    return prisma.payment.findMany({
      where: {
        rentalRequest: {
          tenantId,
        },
      },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string, user: { id: string; role: Role }) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    assertPaymentAccess(payment, user);
    return payment;
  },
};
