import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface AmenityAttributes {
  id: string;
  name: string;
  category:
    | "general"
    | "room"
    | "bathroom"
    | "kitchen"
    | "entertainment"
    | "outdoor"
    | "service";
  icon: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AmenityCreationAttributes
  extends Optional<AmenityAttributes, "id" | "category" | "icon"> {}

class Amenity
  extends Model<AmenityAttributes, AmenityCreationAttributes>
  implements AmenityAttributes
{
  public id!: string;
  public name!: string;
  public category!:
    | "general"
    | "room"
    | "bathroom"
    | "kitchen"
    | "entertainment"
    | "outdoor"
    | "service";
  public icon!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAmenityModel = (sequelize: Sequelize): typeof Amenity => {
  Amenity.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: DataTypes.ENUM(
          "general",
          "room",
          "bathroom",
          "kitchen",
          "entertainment",
          "outdoor",
          "service"
        ),
        defaultValue: "general",
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "amenities",
      timestamps: true,
    }
  );

  return Amenity;
};

export default Amenity;
