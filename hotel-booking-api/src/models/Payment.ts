import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface PaymentAttributes {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: Date | null;
  transaction_date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    | "id"
    | "currency"
    | "payment_status"
    | "stripe_payment_intent_id"
    | "stripe_charge_id"
    | "refund_amount"
    | "refund_reason"
    | "refunded_at"
    | "transaction_date"
  > {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public booking_id!: string;
  public amount!: number;
  public currency!: string;
  public payment_method!: string;
  public payment_status!: "pending" | "completed" | "failed" | "refunded";
  public stripe_payment_intent_id!: string | null;
  public stripe_charge_id!: string | null;
  public refund_amount!: number | null;
  public refund_reason!: string | null;
  public refunded_at!: Date | null;
  public transaction_date!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initPaymentModel = (sequelize: Sequelize): typeof Payment => {
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      booking_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "bookings",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "USD",
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "pending",
      },
      stripe_payment_intent_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripe_charge_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refund_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refunded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      transaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "payments",
      timestamps: true,
      indexes: [
        { fields: ["booking_id"] },
        { fields: ["payment_status"] },
        { fields: ["stripe_payment_intent_id"] },
      ],
    }
  );

  return Payment;
};

export default Payment;
