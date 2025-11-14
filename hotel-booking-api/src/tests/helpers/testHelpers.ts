import { User, Hotel, Room, Booking } from "../../models";
import { generateToken } from "../../utils/tokenUtils";

export const createTestUser = async (
  overrides: Partial<any> = {}
): Promise<User> => {
  const defaultUser = {
    email: "test@example.com",
    password: "Test1234!",
    first_name: "Test",
    last_name: "User",
    role: "user" as const,
    email_verified: true,
    is_active: true,
  };

  return await User.create({ ...defaultUser, ...overrides });
};

export const createTestAdmin = async (
  overrides: Partial<any> = {}
): Promise<User> => {
  return await createTestUser({
    email: "admin@example.com",
    role: "admin" as const,
    ...overrides,
  });
};

export const getAuthToken = (userId: string): string => {
  return generateToken(userId);
};

export const createTestHotel = async (
  overrides: Partial<any> = {}
): Promise<Hotel> => {
  const defaultHotel = {
    name: "Test Hotel",
    description: "A beautiful test hotel with amazing amenities",
    address: "123 Test Street",
    city: "Test City",
    state: "Test State",
    country: "Test Country",
    postal_code: "12345",
    star_rating: 4,
    phone_number: "+1234567890",
    email: "hotel@test.com",
    is_active: true,
  };

  return await Hotel.create({ ...defaultHotel, ...overrides });
};

export const createTestRoom = async (
  hotelId: string,
  overrides: Partial<any> = {}
): Promise<Room> => {
  const defaultRoom = {
    hotel_id: hotelId,
    room_type: "Deluxe",
    description: "Spacious deluxe room",
    price_per_night: 150.0,
    capacity: 2,
    bed_type: "King",
    number_of_beds: 1,
    total_rooms: 5,
    available_rooms: 5,
    is_available: true,
  };

  return await Room.create({ ...defaultRoom, ...overrides });
};

export const createTestBooking = async (
  userId: string,
  roomId: string,
  overrides: Partial<any> = {}
): Promise<Booking> => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  const defaultBooking = {
    user_id: userId,
    room_id: roomId,
    check_in_date: checkIn.toISOString().split("T")[0],
    check_out_date: checkOut.toISOString().split("T")[0],
    number_of_guests: 2,
    number_of_rooms: 1,
    total_price: 450.0,
    guest_name: "Test Guest",
    guest_email: "guest@test.com",
    guest_phone: "+1234567890",
    status: "pending" as const,
  };
  return await Booking.create({ ...defaultBooking, ...overrides });
};
