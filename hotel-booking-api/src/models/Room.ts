import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface RoomAttributes {
  id: string;
  hotel_id: string;
  room_type: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  size_sqm: number | null;
  bed_type: string;
  number_of_beds: number;
  total_rooms: number;
  available_rooms: number;
  amenities: Record<string, any> | null;
  images: string[];
  is_available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoomCreationAttributes
  extends Optional<
    RoomAttributes,
    | "id"
    | "description"
    | "size_sqm"
    | "number_of_beds"
    | "amenities"
    | "images"
    | "is_available"
  > {}

class Room
  extends Model<RoomAttributes, RoomCreationAttributes>
  implements RoomAttributes
{
  public id!: string;
  public hotel_id!: string;
  public room_type!: string;
  public description!: string | null;
  public price_per_night!: number;
  public capacity!: number;
  public size_sqm!: number | null;
  public bed_type!: string;
  public number_of_beds!: number;
  public total_rooms!: number;
  public available_rooms!: number;
  public amenities!: Record<string, any> | null;
  public images!: string[];
  public is_available!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initRoomModel = (sequelize: Sequelize): typeof Room => {
  Room.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      hotel_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "hotels",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      room_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price_per_night: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      size_sqm: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bed_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      number_of_beds: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      total_rooms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      available_rooms: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amenities: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
      },
      is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: "rooms",
      timestamps: true,
      indexes: [
        { fields: ["hotel_id"] },
        { fields: ["price_per_night"] },
        { fields: ["is_available"] },
      ],
    }
  );

  return Room;
};

export default Room;
