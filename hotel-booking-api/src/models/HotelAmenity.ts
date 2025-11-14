import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface HotelAmenityAttributes {
  id: string;
  hotel_id: string;
  amenity_id: string;
}

interface HotelAmenityCreationAttributes
  extends Optional<HotelAmenityAttributes, "id"> {}

class HotelAmenity
  extends Model<HotelAmenityAttributes, HotelAmenityCreationAttributes>
  implements HotelAmenityAttributes
{
  public id!: string;
  public hotel_id!: string;
  public amenity_id!: string;
}

export const initHotelAmenityModel = (
  sequelize: Sequelize
): typeof HotelAmenity => {
  HotelAmenity.init(
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
      amenity_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "amenities",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "hotel_amenities",
      timestamps: false,
      indexes: [{ unique: true, fields: ["hotel_id", "amenity_id"] }],
    }
  );

  return HotelAmenity;
};

export default HotelAmenity;
