import { Model, DataTypes, Sequelize, Optional } from "sequelize";

interface FavoriteAttributes {
  id: string;
  user_id: string;
  hotel_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FavoriteCreationAttributes
  extends Optional<FavoriteAttributes, "id"> {}

class Favorite
  extends Model<FavoriteAttributes, FavoriteCreationAttributes>
  implements FavoriteAttributes
{
  public id!: string;
  public user_id!: string;
  public hotel_id!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initFavoriteModel = (sequelize: Sequelize): typeof Favorite => {
  Favorite.init(
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
    },
    {
      sequelize,
      tableName: "favorites",
      timestamps: true,
      indexes: [{ unique: true, fields: ["user_id", "hotel_id"] }],
    }
  );

  return Favorite;
};

export default Favorite;
