// Legacy D2C brands data - now replaced by Gmail intelligence
// This file exists for backward compatibility

const d2cBrands = {
  "Buck Mason": {
    name: "Buck Mason",
    category: "clothing",
    defaultProduct: {
      title: "Buck Mason Pima Cotton Hoodie",
      price: "$98",
      url: "https://buckmason.com/products/pima-cotton-hoodie"
    }
  },
  "Fellow": {
    name: "Fellow", 
    category: "coffee",
    defaultProduct: {
      title: "Fellow Stagg EKG Electric Kettle",
      price: "$195",
      url: "https://fellowproducts.com/products/stagg-ekg"
    }
  }
};

const amazonAlternatives = {
  "clothing": ["Buck Mason", "Everlane"],
  "coffee": ["Fellow", "Blue Bottle"],
  "home": ["West Elm", "CB2"]
};

module.exports = { d2cBrands, amazonAlternatives };
