import { sequelize } from "../config/database";
import { initUserModel } from "./User";
import { initHotelModel } from "./Hotel";
import { initRoomModel } from "./Room";
import { initBookingModel } from "./Booking";
import { initPaymentModel } from "./Payment";
import { initReviewModel } from "./Review";
import { initFavoriteModel } from "./Favorite";
import { initHotelImageModel } from "./HotelImage";
import { initAmenityModel } from "./Amenity";
import { initHotelAmenityModel } from "./HotelAmenity";

// Initialize all models
const User = initUserModel(sequelize);
const Hotel = initHotelModel(sequelize);
const Room = initRoomModel(sequelize);
const Booking = initBookingModel(sequelize);
const Payment = initPaymentModel(sequelize);
const Review = initReviewModel(sequelize);
const Favorite = initFavoriteModel(sequelize);
const HotelImage = initHotelImageModel(sequelize);
const Amenity = initAmenityModel(sequelize);
const HotelAmenity = initHotelAmenityModel(sequelize);

// Define relationships
User.hasMany(Booking, { foreignKey: "user_id", as: "bookings" });
User.hasMany(Review, { foreignKey: "user_id", as: "reviews" });
User.hasMany(Favorite, { foreignKey: "user_id", as: "favorites" });

Hotel.hasMany(Room, { foreignKey: "hotel_id", as: "rooms" });
Hotel.hasMany(Review, { foreignKey: "hotel_id", as: "reviews" });
Hotel.hasMany(Favorite, { foreignKey: "hotel_id", as: "favorites" });
Hotel.hasMany(HotelImage, { foreignKey: "hotel_id", as: "images" });
Hotel.belongsToMany(Amenity, {
  through: HotelAmenity,
  foreignKey: "hotel_id",
  as: "amenities",
});

Room.belongsTo(Hotel, { foreignKey: "hotel_id", as: "hotel" });
Room.hasMany(Booking, { foreignKey: "room_id", as: "bookings" });

Booking.belongsTo(User, { foreignKey: "user_id", as: "user" });
Booking.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Booking.hasOne(Payment, { foreignKey: "booking_id", as: "payment" });

Payment.belongsTo(Booking, { foreignKey: "booking_id", as: "booking" });

Review.belongsTo(User, { foreignKey: "user_id", as: "user" });
Review.belongsTo(Hotel, { foreignKey: "hotel_id", as: "hotel" });

Favorite.belongsTo(User, { foreignKey: "user_id", as: "user" });
Favorite.belongsTo(Hotel, { foreignKey: "hotel_id", as: "hotel" });

HotelImage.belongsTo(Hotel, { foreignKey: "hotel_id", as: "hotel" });

Amenity.belongsToMany(Hotel, {
  through: HotelAmenity,
  foreignKey: "amenity_id",
  as: "hotels",
});

export {
  sequelize,
  User,
  Hotel,
  Room,
  Booking,
  Payment,
  Review,
  Favorite,
  HotelImage,
  Amenity,
  HotelAmenity,
};
