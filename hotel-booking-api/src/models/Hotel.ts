import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface HotelAttributes {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  star_rating: number;
  average_rating: number;
  total_reviews: number;
  phone_number: string;
  email: string;
  website: string | null;
  check_in_time: string;
  check_out_time: string;
  policies: Record<string, any> | null;
  is_active: boolean;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HotelCreationAttributes
  extends Optional<
    HotelAttributes,
    | "id"
    | "latitude"
    | "longitude"
    | "average_rating"
    | "total_reviews"
    | "website"
    | "check_in_time"
    | "check_out_time"
    | "policies"
    | "is_active"
    | "featured"
  > {}

class Hotel
  extends Model<HotelAttributes, HotelCreationAttributes>
  implements HotelAttributes
{
  public id!: string;
  public name!: string;
  public description!: string;
  public address!: string;
  public city!: string;
  public state!: string;
  public country!: string;
  public postal_code!: string;
  public latitude!: number | null;
  public longitude!: number | null;
  public star_rating!: number;
  public average_rating!: number;
  public total_reviews!: number;
  public phone_number!: string;
  public email!: string;
  public website!: string | null;
  public check_in_time!: string;
  public check_out_time!: string;
  public policies!: Record<string, any> | null;
  public is_active!: boolean;
  public featured!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initHotelModel = (sequelize: Sequelize): typeof Hotel => {
  Hotel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      star_rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.0,
      },
      total_reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      check_in_time: {
        type: DataTypes.TIME,
        defaultValue: "14:00:00",
      },
      check_out_time: {
        type: DataTypes.TIME,
        defaultValue: "11:00:00",
      },
      policies: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "hotels",
      timestamps: true,
      indexes: [
        { fields: ["city", "country"] },
        { fields: ["star_rating"] },
        { fields: ["average_rating"] },
      ],
    }
  );

  return Hotel;
};

export default Hotel;
