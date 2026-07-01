# E-commerce Backend API

A production-ready REST API for an e-commerce platform built with Node.js, Express, and MySQL (raw queries with `mysql2`).

---

## 🛠️ Setup & Configuration

### 1. Database Configuration
Ensure MySQL is running, then configure your connection parameters in the [.env](file:///home/kryssie/Desktop/ecommerce/.env) file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_db

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Run the Application
Install dependencies:
```bash
npm install
```

Start the development server using `nodemon`:
```bash
npm run dev
```

For production deployment:
```bash
npm start
```

---

## 📌 REST API Endpoint & Postman Payload Guide

### 🔐 1. Authentication Endpoints (`/api/auth`)

#### Register User
* **Method**: `POST`
* **URL**: `/api/auth/register`
* **JSON Body**:
```json
{
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "password": "securepassword123",
  "phone": "555-0199",
  "role": "customer"
}
```

#### Login User
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **JSON Body**:
```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

#### Get Logged-in User Profile
* **Method**: `GET`
* **URL**: `/api/auth/me`
* **Headers**: `Authorization: Bearer <token>`

---

### 👤 2. User Settings (`/api/users`)

#### Update Profile
* **Method**: `PUT`
* **URL**: `/api/users/profile`
* **Headers**: `Authorization: Bearer <token>`
* **JSON Body**:
```json
{
  "first_name": "Alicia",
  "last_name": "Smith-Jones",
  "phone": "555-9999"
}
```

#### Change Password
* **Method**: `PUT`
* **URL**: `/api/users/change-password`
* **Headers**: `Authorization: Bearer <token>`
* **JSON Body**:
```json
{
  "current_password": "securepassword123",
  "new_password": "newsupersecure123"
}
```

---

### 📂 3. Categories (`/api/categories`)

#### Create Category (Admin Only)
* **Method**: `POST`
* **URL**: `/api/categories`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **JSON Body**:
```json
{
  "name": "Home Appliances"
}
```

#### Get All Categories (Public)
* **Method**: `GET`
* **URL**: `/api/categories`

#### Update Category (Admin Only)
* **Method**: `PUT`
* **URL**: `/api/categories/:id`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **JSON Body**:
```json
{
  "name": "Smart Home Appliances"
}
```

#### Delete Category (Admin Only)
* **Method**: `DELETE`
* **URL**: `/api/categories/:id`
* **Headers**: `Authorization: Bearer <token_of_admin>`

---

### 🏷️ 4. Products & Images (`/api/products`)

#### Create Product (Admin Only)
* **Method**: `POST`
* **URL**: `/api/products`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **Body Type**: `form-data` (Multipart Form)

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `name` | Text | `Smart Coffee Maker` | Product Name |
| `price` | Text | `89.99` | Product Price |
| `stock` | Text | `45` | Quantity in Stock |
| `category_id` | Text | `1` | ID of Category |
| `description` | Text | `WiFi enabled espresso and coffee brewer.` | Description |
| `images` | File | `[Select image files]` | Upload up to 5 files |

#### Get All Products (Public)
* **Method**: `GET`
* **URL**: `/api/products`
* **Query Parameters**:
  - `page`: Page index (default: 1)
  - `limit`: Page count (default: 10)
  - `search`: Filter by name/description (e.g. `?search=iphone`)
  - `category`: Filter by category ID (e.g. `?category=2`)
  - `minPrice`: Minimum price range (e.g. `?minPrice=100`)
  - `maxPrice`: Maximum price range (e.g. `?maxPrice=1000`)
  - `sort`: Sort criteria (`price_asc`, `price_desc`, `newest`)

#### Update Product details (Admin Only)
* **Method**: `PUT`
* **URL**: `/api/products/:id`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **JSON Body**:
```json
{
  "name": "Smart Coffee Maker v2",
  "price": 99.99,
  "stock": 40,
  "description": "Upgraded WiFi coffee maker with timer options."
}
```

#### Delete Product (Admin Only)
* **Method**: `DELETE`
* **URL**: `/api/products/:id`
* **Headers**: `Authorization: Bearer <token_of_admin>`

#### Add Product Images (Admin Only)
* **Method**: `POST`
* **URL**: `/api/products/:id/images`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **Body Type**: `form-data` (`images`: File array)

#### Replace Product Image (Admin Only)
* **Method**: `PUT`
* **URL**: `/api/products/:id/images/:imageId`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **Body Type**: `form-data` (`image`: Single File)

#### Delete Product Image (Admin Only)
* **Method**: `DELETE`
* **URL**: `/api/products/:id/images/:imageId`
* **Headers**: `Authorization: Bearer <token_of_admin>`

---

### 🛒 5. Shopping Cart (`/api/cart`)

#### Add Item to Cart
* **Method**: `POST`
* **URL**: `/api/cart`
* **Headers**: `Authorization: Bearer <token>`
* **JSON Body**:
```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### Update Cart Item Quantity
* **Method**: `PUT`
* **URL**: `/api/cart/items/:productId`
* **Headers**: `Authorization: Bearer <token>`
* **JSON Body**:
```json
{
  "quantity": 5
}
```

#### Remove Item from Cart
* **Method**: `DELETE`
* **URL**: `/api/cart/items/:productId`
* **Headers**: `Authorization: Bearer <token>`

#### Clear Cart
* **Method**: `DELETE`
* **URL**: `/api/cart`
* **Headers**: `Authorization: Bearer <token>`

---

### 📦 6. Orders (`/api/orders`)

#### Place Order
* **Method**: `POST`
* **URL**: `/api/orders`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Submits the order from the current items inside the shopping cart.

#### Update Order Status (Admin Only)
* **Method**: `PUT`
* **URL**: `/api/orders/:id/status`
* **Headers**: `Authorization: Bearer <token_of_admin>`
* **JSON Body**:
```json
{
  "status": "Processing"
}
```
*(Valid statuses: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)*
