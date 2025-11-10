import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface ReviewAttributes {
  id: string;
  user_id: string;
  hotel_id: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness_rating: number | null;
  service_rating: number | null;
  location_rating: number | null;
  value_rating: number | null;
  is_verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReviewCreationAttributes
  extends Optional<
    ReviewAttributes,
    | "id"
    | "cleanliness_rating"
    | "service_rating"
    | "location_rating"
    | "value_rating"
    | "is_verified"
  > {}

class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  public id!: string;
  public user_id!: string;
  public hotel_id!: string;
  public rating!: number;
  public title!: string;
  public comment!: string;
  public cleanliness_rating!: number | null;
  public service_rating!: number | null;
  public location_rating!: number | null;
  public value_rating!: number | null;
  public is_verified!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initReviewModel = (sequelize: Sequelize): typeof Review => {
  Review.init(
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
      hotel_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "hotels",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cleanliness_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      service_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      location_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      value_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: "reviews",
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["hotel_id"] },
        { unique: true, fields: ["user_id", "hotel_id"] },
      ],
    }
  );

  return Review;
};

export default Review;
