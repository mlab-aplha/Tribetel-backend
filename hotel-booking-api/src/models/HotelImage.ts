import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface HotelImageAttributes {
  id: string;
  hotel_id: string;
  url: string;
  public_id: string | null;
  is_primary: boolean;
  caption: string | null;
  display_order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HotelImageCreationAttributes 
  extends Optional<HotelImageAttributes, 
    'id' | 
    'public_id' | 
    'is_primary' | 
    'caption' | 
    'display_order'
  > {}

class HotelImage extends Model<HotelImageAttributes, HotelImageCreationAttributes> implements HotelImageAttributes {
  public id!: string;
  public hotel_id!: string;
  public url!: string;
  public public_id!: string | null;
  public is_primary!: boolean;
  public caption!: string | null;
  public display_order!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initHotelImageModel = (sequelize: Sequelize): typeof HotelImage => {
  HotelImage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      hotel_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'hotels',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      public_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      caption: {
        type: DataTypes.STRING,
        allowNull: true
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'hotel_images',
      timestamps: true,
      indexes: [
        { fields: ['hotel_id'] }
      ]
    }
  );

  return HotelImage;
};

export default HotelImage;