import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface BookingAttributes {
  id: string;
  user_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms: number;
  total_price: number;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  special_requests: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  cancellation_reason: string | null;
  cancelled_at: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BookingCreationAttributes
  extends Optional<
    BookingAttributes,
    | "id"
    | "number_of_rooms"
    | "status"
    | "special_requests"
    | "cancellation_reason"
    | "cancelled_at"
  > {}

class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  public id!: string;
  public user_id!: string;
  public room_id!: string;
  public check_in_date!: string;
  public check_out_date!: string;
  public number_of_guests!: number;
  public number_of_rooms!: number;
  public total_price!: number;
  public status!:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "cancelled";
  public special_requests!: string | null;
  public guest_name!: string;
  public guest_email!: string;
  public guest_phone!: string;
  public cancellation_reason!: string | null;
  public cancelled_at!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initBookingModel = (sequelize: Sequelize): typeof Booking => {
  Booking.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      room_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "rooms",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      check_in_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      check_out_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      number_of_guests: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      number_of_rooms: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "checked_in",
          "checked_out",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      special_requests: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      guest_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guest_email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guest_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "bookings",
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["room_id"] },
        { fields: ["status"] },
        { fields: ["check_in_date", "check_out_date"] },
      ],
    }
  );

  return Booking;
};

export default Booking;
