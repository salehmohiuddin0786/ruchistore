const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { connectDB } = require("../config/db");
const {
  sequelize,
  User,
  Shop,
  Category,
  Product,
  Inventory,
  Coupon,
  Banner,
  Offer,
  DeliveryPartner,
  Address,
} = require("../models");

require("dotenv").config();

const seed = async () => {
  try {
    await connectDB();
    console.log("🌱 Starting Ruchi Store database seeding...");

    const standardPassword = "Admin@123";
    const salt = await bcrypt.genSalt(10);
    const hashedStandardPassword = await bcrypt.hash(standardPassword, salt);

    // Helper to upsert users safely and update their passwords to Admin@123
    const upsertUser = async ({ phone, email, name, role, password }) => {
      let user = await User.findOne({
        where: {
          [Op.or]: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (user) {
        await user.update({
          name: name || user.name,
          email: email || user.email,
          phone: phone || user.phone,
          password: password || user.password,
          role: role || user.role,
          is_verified: true,
          is_blocked: false,
        });
      } else {
        user = await User.create({
          name,
          phone,
          email,
          password,
          role,
          is_verified: true,
          is_blocked: false,
        });
      }
      return user;
    };

    // 1. Create / Update Admin (mail: admin@store, Pass: Admin@123)
    const adminUser = await upsertUser({
      name: "Ruchi Store SuperAdmin",
      phone: "9999999999",
      email: "admin@store",
      password: hashedStandardPassword,
      role: "ADMIN",
    });
    console.log(`✅ Admin ready: admin@store (Pass: ${standardPassword})`);

    // 2. Create / Update Demo Customer (mail: customer@store, Pass: Admin@123, Phone: 9876543210)
    const customerUser = await upsertUser({
      name: "Rahul Sharma",
      phone: "9876543210",
      email: "customer@store",
      password: hashedStandardPassword,
      role: "CUSTOMER",
    });
    console.log(`✅ Customer ready: customer@store (Phone: 9876543210, Pass: ${standardPassword})`);

    // Customer default address
    await Address.findOrCreate({
      where: { user_id: customerUser.id, is_default: true },
      defaults: {
        user_id: customerUser.id,
        name: "Rahul Sharma",
        phone: "9876543210",
        house_flat: "Flat 402, Cyber Heights",
        address_line: "Road No. 36, Madhapur",
        landmark: "Near Metro Pillar 1042",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500081",
        latitude: 17.448293,
        longitude: 78.391485,
        type: "HOME",
        is_default: true,
        delivery_instructions: "Ring doorbell and leave at doorstep",
      },
    });

    // 3. Create Shop Owners and Shops
    const shopData = [
      {
        ownerName: "Vikram Mehta",
        ownerEmail: "owner@store",
        ownerPhone: "9876543201",
        shop: {
          name: "Ruchi Mart",
          slug: "ruchi-mart-madhapur",
          logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
          cover_image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
          description: "Your local destination for fresh farm vegetables, dairy, pulses, and pantry essentials in 15 minutes.",
          phone: "9876543201",
          email: "support@ruchimart.com",
          address: "Shop 12, Ground Floor, Madhapur Main Road",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
          latitude: 17.448500,
          longitude: 78.390800,
          opening_time: "06:00 AM",
          closing_time: "11:30 PM",
          delivery_radius: 12.0,
          minimum_order: 0.0,
          estimated_delivery_time: "15-20 min",
          is_open: true,
          status: "APPROVED",
          rating: 4.85,
          total_reviews: 142,
          commission_percentage: 10.0,
          gst_number: "36AAAAA0000A1Z5",
        },
      },
      {
        ownerName: "Anita Rao",
        ownerEmail: "owner.freshbasket@ruchistore.com",
        ownerPhone: "9876543202",
        shop: {
          name: "Fresh Basket",
          slug: "fresh-basket-jubilee-hills",
          logo: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=400&q=80",
          cover_image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80",
          description: "Curated organic fruits, gourmet cheese, bakery items and premium daily groceries.",
          phone: "9876543202",
          email: "hello@freshbasket.com",
          address: "Plot 45, Road No 10, Jubilee Hills",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
          latitude: 17.431900,
          longitude: 78.407300,
          opening_time: "07:00 AM",
          closing_time: "11:00 PM",
          delivery_radius: 10.0,
          minimum_order: 0.0,
          estimated_delivery_time: "10-15 min",
          is_open: true,
          status: "APPROVED",
          rating: 4.92,
          total_reviews: 98,
          commission_percentage: 10.0,
          gst_number: "36BBBBB1111B2Z6",
        },
      },
      {
        ownerName: "Sunil Agarwal",
        ownerEmail: "owner.dailyneeds@ruchistore.com",
        ownerPhone: "9876543203",
        shop: {
          name: "Daily Needs Superstore",
          slug: "daily-needs-gachibowli",
          logo: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80",
          cover_image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1200&q=80",
          description: "High-value family grocery packs, staples, cooking oil, household cleaning, and personal care.",
          phone: "9876543203",
          email: "care@dailyneeds.com",
          address: "DLF Cybercity Road, Gachibowli",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500032",
          latitude: 17.443500,
          longitude: 78.357100,
          opening_time: "06:30 AM",
          closing_time: "11:00 PM",
          delivery_radius: 12.0,
          minimum_order: 0.0,
          estimated_delivery_time: "20-25 min",
          is_open: true,
          status: "APPROVED",
          rating: 4.70,
          total_reviews: 115,
          commission_percentage: 8.5,
          gst_number: "36CCCCC2222C3Z7",
        },
      },
      {
        ownerName: "Pooja Reddy",
        ownerEmail: "owner.smartgrocery@ruchistore.com",
        ownerPhone: "9876543204",
        shop: {
          name: "Smart Grocery",
          slug: "smart-grocery-kondapur",
          logo: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=400&q=80",
          cover_image: "https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=1200&q=80",
          description: "Neighborhood express grocery mart delivering beverages, chocolates, snacks, and morning milk.",
          phone: "9876543204",
          email: "kondapur@smartgrocery.com",
          address: "Near Botanical Garden, Kondapur",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500084",
          latitude: 17.462200,
          longitude: 78.365400,
          opening_time: "06:00 AM",
          closing_time: "11:59 PM",
          delivery_radius: 10.0,
          minimum_order: 0.0,
          estimated_delivery_time: "15-20 min",
          is_open: true,
          status: "APPROVED",
          rating: 4.65,
          total_reviews: 86,
          commission_percentage: 9.0,
          gst_number: "36DDDDD3333D4Z8",
        },
      },
    ];

    const createdShops = [];
    for (const item of shopData) {
      const owner = await upsertUser({
        name: item.ownerName,
        phone: item.ownerPhone,
        email: item.ownerEmail,
        password: hashedStandardPassword,
        role: "SHOP_OWNER",
      });

      const [shop] = await Shop.findOrCreate({
        where: { slug: item.shop.slug },
        defaults: {
          ...item.shop,
          owner_id: owner.id,
        },
      });

      if (shop.owner_id !== owner.id) {
        await shop.update({ owner_id: owner.id });
      }

      createdShops.push(shop);
    }
    console.log(`✅ ${createdShops.length} Approved Shops seeded with Owner owner@store (Pass: ${standardPassword})`);

    // 4. Create Delivery Partners (mail: delivery@store, Pass: Admin@123)
    const deliveryPartnerData = [
      {
        name: "Ramesh Kumar",
        email: "delivery@store",
        phone: "9876543220",
        vehicle_type: "BIKE",
        vehicle_number: "TS 09 AB 1234",
        license_number: "DL-TS09-20210045",
        is_online: true,
        is_approved: true,
        status: "APPROVED",
        current_lat: 17.4475,
        current_lng: 78.3905,
      },
      {
        name: "Suresh Reddy",
        email: "delivery2@ruchistore.com",
        phone: "9876543221",
        vehicle_type: "SCOOTER",
        vehicle_number: "TS 08 XY 5678",
        license_number: "DL-TS08-20220098",
        is_online: true,
        is_approved: true,
        status: "APPROVED",
        current_lat: 17.4490,
        current_lng: 78.3920,
      },
    ];

    for (const dp of deliveryPartnerData) {
      const user = await upsertUser({
        name: dp.name,
        phone: dp.phone,
        email: dp.email,
        password: hashedStandardPassword,
        role: "DELIVERY_PARTNER",
      });

      const [record] = await DeliveryPartner.findOrCreate({
        where: { user_id: user.id },
        defaults: {
          user_id: user.id,
          vehicle_type: dp.vehicle_type,
          vehicle_number: dp.vehicle_number,
          license_number: dp.license_number,
          is_online: dp.is_online,
          is_approved: dp.is_approved,
          status: dp.status,
          current_lat: dp.current_lat,
          current_lng: dp.current_lng,
          total_deliveries: 34,
          total_earnings: 2850.0,
          rating: 4.9,
        },
      });

      await record.update({
        is_online: dp.is_online,
        is_approved: dp.is_approved,
        status: dp.status,
      });
    }
    console.log(`✅ 2 Delivery Partners seeded with Partner delivery@store (Pass: ${standardPassword})`);

    // 5. Create 16 Categories
    const categoriesData = [
      {
        name: "Fruits",
        slug: "fruits",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80",
        icon: "Apple",
        description: "Fresh orchard apples, bananas, citrus, berries & seasonal fruits",
        display_order: 1,
      },
      {
        name: "Vegetables",
        slug: "vegetables",
        image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80",
        icon: "Carrot",
        description: "Farm-fresh daily greens, potatoes, onions, tomatoes & root vegetables",
        display_order: 2,
      },
      {
        name: "Dairy",
        slug: "dairy",
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80",
        icon: "Milk",
        description: "Pure milk, curd, paneer, butter, cheese, ghee & dairy essentials",
        display_order: 3,
      },
      {
        name: "Bakery",
        slug: "bakery",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
        icon: "Croissant",
        description: "Soft breads, burger buns, pav, cookies, cakes & breakfast bakery",
        display_order: 4,
      },
      {
        name: "Rice & Grains",
        slug: "rice-grains",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
        icon: "Wheat",
        description: "Premium basmati rice, sona masoori, wheat atta, maida & suji",
        display_order: 5,
      },
      {
        name: "Dal & Pulses",
        slug: "dal-pulses",
        image: "https://images.unsplash.com/photo-1585996884666-414c2b9a7c38?auto=format&fit=crop&w=400&q=80",
        icon: "Layers",
        description: "Unpolished toor dal, moong dal, urad dal, chana & rajma",
        display_order: 6,
      },
      {
        name: "Oil & Masala",
        slug: "oil-masala",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
        icon: "Droplets",
        description: "Sunflower oil, mustard oil, ghee, whole spices & ground masalas",
        display_order: 7,
      },
      {
        name: "Snacks",
        slug: "snacks",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80",
        icon: "Cookie",
        description: "Crispy chips, namkeens, popcorn, roasted nuts & instant bites",
        display_order: 8,
      },
      {
        name: "Beverages",
        slug: "beverages",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
        icon: "Coffee",
        description: "Cold drinks, mineral water, fruit juices, tea, coffee & syrups",
        display_order: 9,
      },
      {
        name: "Biscuits",
        slug: "biscuits",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80",
        icon: "Cookie",
        description: "Glucose, butter cookies, cream biscuits, rusks & crackers",
        display_order: 10,
      },
      {
        name: "Chocolates",
        slug: "chocolates",
        image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=80",
        icon: "Sparkles",
        description: "Milk chocolate, dark cocoa bars, candies, gums & sweets",
        display_order: 11,
      },
      {
        name: "Personal Care",
        slug: "personal-care",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
        icon: "Heart",
        description: "Shampoos, conditioners, bathing soaps, body wash & oral care",
        display_order: 12,
      },
      {
        name: "Household",
        slug: "household",
        image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=400&q=80",
        icon: "Home",
        description: "Garbage bags, tissues, foils, matchboxes & kitchen utilities",
        display_order: 13,
      },
      {
        name: "Cleaning",
        slug: "cleaning",
        image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=400&q=80",
        icon: "Sparkle",
        description: "Floor cleaners, toilet cleaners, dishwash bars, liquids & sponges",
        display_order: 14,
      },
      {
        name: "Baby Care",
        slug: "baby-care",
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80",
        icon: "Smile",
        description: "Baby diapers, wet wipes, baby lotions, shampoos & infant foods",
        display_order: 15,
      },
      {
        name: "Pet Care",
        slug: "pet-care",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80",
        icon: "PawPrint",
        description: "Nutritious dog food, cat food, pet shampoos & treats",
        display_order: 16,
      },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const [record] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
      });
      categoryMap[cat.slug] = record.id;
    }
    console.log(`✅ 16 Grocery Categories seeded`);

    // 6. Create 30+ Realistic Products
    const primaryShop = createdShops[0]; // Ruchi Mart
    const secondaryShop = createdShops[1]; // Fresh Basket

    const productsData = [
      {
        name: "Royal Gala Apples",
        slug: "royal-gala-apples",
        categorySlug: "fruits",
        price: 150.0,
        discount_price: 120.0,
        unit: "kg",
        unit_value: "1 kg (approx 4-5 pcs)",
        description: "Sweet, crisp and aromatic royal gala apples sourced freshly from Himalayan orchards.",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
        stock: 50,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Fresh Robusta Bananas",
        slug: "fresh-robusta-bananas",
        categorySlug: "fruits",
        price: 60.0,
        discount_price: 48.0,
        unit: "dozen",
        unit_value: "12 pcs",
        description: "Naturally ripened robusta bananas rich in potassium and instant energy.",
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
        stock: 80,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Nagpur Sweet Oranges",
        slug: "nagpur-sweet-oranges",
        categorySlug: "fruits",
        price: 90.0,
        discount_price: 75.0,
        unit: "kg",
        unit_value: "1 kg",
        description: "Juicy, vitamin-C loaded sweet oranges bursting with fresh citrus flavor.",
        image: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80",
        stock: 45,
        is_featured: false,
        is_bestseller: false,
      },
      {
        name: "Hybrid Red Tomatoes",
        slug: "hybrid-red-tomatoes",
        categorySlug: "vegetables",
        price: 40.0,
        discount_price: 32.0,
        unit: "kg",
        unit_value: "1 kg",
        description: "Plump, firm and juicy red tomatoes perfect for curries, salads and soups.",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
        stock: 120,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Jyoti Potatoes",
        slug: "jyoti-potatoes",
        categorySlug: "vegetables",
        price: 35.0,
        discount_price: 28.0,
        unit: "kg",
        unit_value: "1 kg",
        description: "Daily fresh kitchen essential potatoes with smooth skin and consistent texture.",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
        stock: 150,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Nashik Red Onions",
        slug: "nashik-red-onions",
        categorySlug: "vegetables",
        price: 45.0,
        discount_price: 38.0,
        unit: "kg",
        unit_value: "1 kg",
        description: "Pungent and flavorful medium red onions, essential for every Indian dish.",
        image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80",
        stock: 130,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Amul Taaza Homogenised Toned Milk",
        slug: "amul-taaza-toned-milk-1l",
        categorySlug: "dairy",
        price: 68.0,
        discount_price: 65.0,
        unit: "L",
        unit_value: "1 Litre Tetra Pack",
        description: "Sterilized and homogenized toned milk with 3.0% fat, zero preservatives.",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
        stock: 60,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Nandini Fresh Thick Curd",
        slug: "nandini-fresh-thick-curd-500g",
        categorySlug: "dairy",
        price: 38.0,
        discount_price: 35.0,
        unit: "pack",
        unit_value: "500 g pouch",
        description: "Creamy, naturally set probiotic rich fresh dahi.",
        image: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80",
        stock: 40,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Amul Pasteurised Butter",
        slug: "amul-pasteurised-butter-100g",
        categorySlug: "dairy",
        price: 58.0,
        discount_price: 54.0,
        unit: "pack",
        unit_value: "100 g",
        description: "The classic Utterly Butterly Delicious Indian salted butter.",
        image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
        stock: 45,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Fresh Malai Paneer",
        slug: "fresh-malai-paneer-200g",
        categorySlug: "dairy",
        price: 95.0,
        discount_price: 85.0,
        unit: "pack",
        unit_value: "200 g",
        description: "Soft, spongy and protein-rich paneer cubes made from 100% cow milk.",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
        stock: 35,
        is_featured: true,
        is_bestseller: false,
      },
      {
        name: "Modern 100% Whole Wheat Bread",
        slug: "modern-whole-wheat-bread-400g",
        categorySlug: "bakery",
        price: 50.0,
        discount_price: 45.0,
        unit: "pack",
        unit_value: "400 g",
        description: "Wholesome high-fiber brown bread baked with goodness of pure whole grains.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        stock: 30,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Farm Fresh White Eggs",
        slug: "farm-fresh-white-eggs-6pcs",
        categorySlug: "dairy",
        price: 54.0,
        discount_price: 48.0,
        unit: "pack",
        unit_value: "Pack of 6",
        description: "Hygienically sorted and sanitized farm-fresh eggs loaded with high protein.",
        image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=600&q=80",
        stock: 65,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Daawat Rozana Gold Basmati Rice",
        slug: "daawat-rozana-basmati-rice-5kg",
        categorySlug: "rice-grains",
        price: 420.0,
        discount_price: 365.0,
        unit: "pack",
        unit_value: "5 kg bag",
        description: "Aromatic long grain basmati rice, aged to perfection for everyday fluffy rice dishes.",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
        stock: 40,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Aashirvaad Superior MP Sharbati Atta",
        slug: "aashirvaad-sharbati-atta-5kg",
        categorySlug: "rice-grains",
        price: 275.0,
        discount_price: 245.0,
        unit: "pack",
        unit_value: "5 kg bag",
        description: "100% pure whole wheat chakki atta for soft and fluffy rotis.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        stock: 55,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Tata Sampann Unpolished Toor Dal",
        slug: "tata-sampann-toor-dal-1kg",
        categorySlug: "dal-pulses",
        price: 180.0,
        discount_price: 160.0,
        unit: "pack",
        unit_value: "1 kg",
        description: "Unpolished pigeon pea dal retaining natural goodness and authentic home taste.",
        image: "https://images.unsplash.com/photo-1585996884666-414c2b9a7c38?auto=format&fit=crop&w=600&q=80",
        stock: 70,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Fortune Sunlite Refined Sunflower Oil",
        slug: "fortune-sunflower-oil-1l",
        categorySlug: "oil-masala",
        price: 165.0,
        discount_price: 145.0,
        unit: "L",
        unit_value: "1 Litre Pouch",
        description: "Enriched with Vitamins A & D, light on stomach and heart healthy cooking oil.",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        stock: 85,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Madhur Pure & Hygienic Sugar",
        slug: "madhur-hygienic-sugar-1kg",
        categorySlug: "oil-masala",
        price: 55.0,
        discount_price: 49.0,
        unit: "pack",
        unit_value: "1 kg",
        description: "Sulphur-free, untouched by hands sparkling white crystal sugar.",
        image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",
        stock: 90,
        is_featured: false,
        is_bestseller: false,
      },
      {
        name: "Tata Vacuum Evaporated Iodized Salt",
        slug: "tata-iodized-salt-1kg",
        categorySlug: "oil-masala",
        price: 28.0,
        discount_price: 25.0,
        unit: "pack",
        unit_value: "1 kg",
        description: "Desh ka Namak, vacuum evaporated pure white iodized cooking salt.",
        image: "https://images.unsplash.com/photo-1626197031507-c17099753214?auto=format&fit=crop&w=600&q=80",
        stock: 120,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Britannia Good Day Butter Cookies",
        slug: "britannia-good-day-butter-200g",
        categorySlug: "biscuits",
        price: 40.0,
        discount_price: 35.0,
        unit: "pack",
        unit_value: "200 g",
        description: "Rich butter flavored crisp cookies with delight in every bite.",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
        stock: 75,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Lay's Classic Salted Potato Chips",
        slug: "lays-classic-salted-chips-50g",
        categorySlug: "snacks",
        price: 20.0,
        discount_price: 20.0,
        unit: "pack",
        unit_value: "50 g pouch",
        description: "Thin cut crispy fried potato chips seasoned with fine salt.",
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
        stock: 100,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Cadbury Bournville 50% Rich Cocoa Dark Chocolate",
        slug: "cadbury-bournville-dark-80g",
        categorySlug: "chocolates",
        price: 110.0,
        discount_price: 95.0,
        unit: "piece",
        unit_value: "80 g bar",
        description: "Smooth, velvety dark chocolate crafted from the finest cocoa beans.",
        image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80",
        stock: 40,
        is_featured: true,
        is_bestseller: false,
      },
      {
        name: "Frooti Fresh Mango Drink",
        slug: "frooti-mango-drink-1-2l",
        categorySlug: "beverages",
        price: 75.0,
        discount_price: 65.0,
        unit: "bottle",
        unit_value: "1.2 Litre Pet Bottle",
        description: "Sweet mango indulgence made from rich Totapuri mango pulp.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80",
        stock: 50,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Kinley Packaged Drinking Water",
        slug: "kinley-drinking-water-1l",
        categorySlug: "beverages",
        price: 20.0,
        discount_price: 20.0,
        unit: "bottle",
        unit_value: "1 Litre",
        description: "Purified drinking water with added essential minerals.",
        image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=600&q=80",
        stock: 120,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Dove Daily Shine Shampoo",
        slug: "dove-daily-shine-shampoo-340ml",
        categorySlug: "personal-care",
        price: 299.0,
        discount_price: 249.0,
        unit: "bottle",
        unit_value: "340 ml",
        description: "Nutritive serum formula protects daily wear and tear for shiny hair.",
        image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80",
        stock: 35,
        is_featured: false,
        is_bestseller: false,
      },
      {
        name: "Dettol Original Germ Protection Bathing Soap",
        slug: "dettol-original-soap-3x125g",
        categorySlug: "personal-care",
        price: 175.0,
        discount_price: 149.0,
        unit: "pack",
        unit_value: "Pack of 3 (125g each)",
        description: "Trusted 99.9% germ protection with pine fragrance and glycerin moisturizers.",
        image: "https://images.unsplash.com/photo-1607006314177-38e9b6e8e826?auto=format&fit=crop&w=600&q=80",
        stock: 50,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Colgate Vedshakti Ayurvedic Toothpaste",
        slug: "colgate-vedshakti-toothpaste-200g",
        categorySlug: "personal-care",
        price: 130.0,
        discount_price: 110.0,
        unit: "pack",
        unit_value: "200 g",
        description: "Ayurvedic blend of neem, clove, tulsi, and camphor for gum strength and fresh breath.",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        stock: 60,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Surf Excel Easy Wash Detergent Powder",
        slug: "surf-excel-easy-wash-1kg",
        categorySlug: "cleaning",
        price: 160.0,
        discount_price: 139.0,
        unit: "pack",
        unit_value: "1 kg",
        description: "Superfine powder engineered with stain removing power of 10 hands.",
        image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80",
        stock: 45,
        is_featured: true,
        is_bestseller: true,
      },
      {
        name: "Vim Lemon Dishwash Liquid Gel",
        slug: "vim-lemon-dishwash-gel-750ml",
        categorySlug: "cleaning",
        price: 155.0,
        discount_price: 130.0,
        unit: "bottle",
        unit_value: "750 ml squeezy bottle",
        description: "Power of 100 lemons dissolves toughest grease without leaving residue.",
        image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=600&q=80",
        stock: 50,
        is_featured: false,
        is_bestseller: true,
      },
      {
        name: "Pampers All Round Protection Baby Diaper Pants (M)",
        slug: "pampers-baby-diapers-medium-30pcs",
        categorySlug: "baby-care",
        price: 499.0,
        discount_price: 419.0,
        unit: "pack",
        unit_value: "Medium (7-12kg) - 30 Pants",
        description: "Anti-rash blanket lotion with aloe vera offering up to 12 hours absorption.",
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80",
        stock: 25,
        is_featured: false,
        is_bestseller: false,
      },
      {
        name: "Pedigree Adult Chicken & Vegetables Dry Dog Food",
        slug: "pedigree-adult-dog-food-1-2kg",
        categorySlug: "pet-care",
        price: 360.0,
        discount_price: 315.0,
        unit: "pack",
        unit_value: "1.2 kg pouch",
        description: "Complete and balanced dry food packed with proteins and calcium for strong teeth and bones.",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80",
        stock: 20,
        is_featured: false,
        is_bestseller: false,
      },
      {
        name: "Twinings Pure Green Tea Bags",
        slug: "twinings-pure-green-tea-25bags",
        categorySlug: "beverages",
        price: 250.0,
        discount_price: 210.0,
        unit: "pack",
        unit_value: "25 Tea Bags",
        description: "Antioxidant rich delicate green tea leaves carefully steam-processed.",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
        stock: 3, // Low stock item for inventory testing
        low_stock_threshold: 5,
        is_featured: false,
        is_bestseller: false,
      },
    ];

    let seededCount = 0;
    for (const p of productsData) {
      const categoryId = categoryMap[p.categorySlug] || 1;
      const targetShop = seededCount % 3 === 0 ? secondaryShop : primaryShop;

      const [product] = await Product.findOrCreate({
        where: { slug: p.slug },
        defaults: {
          shop_id: targetShop.id,
          category_id: categoryId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          image: p.image,
          price: p.price,
          discount_price: p.discount_price,
          unit: p.unit,
          unit_value: p.unit_value,
          stock_quantity: p.stock,
          reserved_quantity: 0,
          low_stock_threshold: p.low_stock_threshold || 5,
          is_available: true,
          is_featured: p.is_featured || false,
          is_bestseller: p.is_bestseller || false,
          rating: 4.8,
          total_reviews: 18,
        },
      });

      await Inventory.findOrCreate({
        where: { product_id: product.id, shop_id: targetShop.id },
        defaults: {
          product_id: product.id,
          shop_id: targetShop.id,
          stock_quantity: p.stock,
          reserved_quantity: 0,
          low_stock_threshold: p.low_stock_threshold || 5,
        },
      });

      seededCount++;
    }
    console.log(`✅ ${seededCount} Grocery Products seeded with stock & inventory`);

    // 7. Seed Coupons
    const couponsData = [
      {
        code: "SAVE50",
        description: "Get flat ₹50 OFF on orders above ₹299",
        discount_type: "FIXED",
        discount_value: 50.0,
        min_order_amount: 299.0,
        is_active: true,
      },
      {
        code: "WELCOME100",
        description: "First Order Special: Get ₹100 OFF on orders above ₹499",
        discount_type: "FIXED",
        discount_value: 100.0,
        min_order_amount: 499.0,
        is_first_order_only: true,
        is_active: true,
      },
      {
        code: "QUICK20",
        description: "Get 20% OFF up to ₹150 on pantry orders above ₹399",
        discount_type: "PERCENTAGE",
        discount_value: 20.0,
        min_order_amount: 399.0,
        max_discount_amount: 150.0,
        is_active: true,
      },
    ];

    for (const c of couponsData) {
      await Coupon.findOrCreate({
        where: { code: c.code },
        defaults: c,
      });
    }
    console.log(`✅ ${couponsData.length} Promotional Coupons seeded`);

    // 8. Seed Banners & Offers
    const bannersData = [
      {
        title: "10-Minute Grocery Delivery",
        subtitle: "Fresh vegetables, dairy & daily needs at your doorstep",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        link: "/categories",
        display_order: 1,
      },
      {
        title: "Farm Fresh Morning Fruits",
        subtitle: "Handpicked crisp apples, oranges & berries with flat 20% discount",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80",
        link: "/category/fruits",
        display_order: 2,
      },
      {
        title: "Mega Pantry Savings",
        subtitle: "Staples, cooking oil and pulses at unbeatable wholesale rates",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
        link: "/category/rice-grains",
        display_order: 3,
      },
    ];

    for (const b of bannersData) {
      await Banner.findOrCreate({
        where: { title: b.title },
        defaults: b,
      });
    }

    const offersData = [
      {
        title: "Flat ₹50 OFF",
        description: "On your daily essentials purchase of ₹299 or more",
        discount_tag: "SAVE ₹50",
        coupon_code: "SAVE50",
        image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
        is_active: true,
      },
      {
        title: "New Customer Delight",
        description: "Welcome offer: ₹100 instant cash discount on first order",
        discount_tag: "₹100 OFF",
        coupon_code: "WELCOME100",
        image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80",
        is_active: true,
      },
      {
        title: "Express 20% Discount",
        description: "Save 20% up to ₹150 on household & personal care items",
        discount_tag: "20% OFF",
        coupon_code: "QUICK20",
        image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
        is_active: true,
      },
    ];

    for (const o of offersData) {
      await Offer.findOrCreate({
        where: { coupon_code: o.coupon_code },
        defaults: o,
      });
    }

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
