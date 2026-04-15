// Base URL of backend server
var API_BASE = 'http://localhost:5000';

// Unit lists per category
var UNITS = {
  LENGTH:      ['Feet', 'Inch', 'Yard', 'Centimeter'],
  WEIGHT:      ['Kilogram', 'Gram', 'Pound'],
  VOLUME:      ['Litre', 'Millilitre', 'Gallon'],
  TEMPERATURE: ['Celsius', 'Fahrenheit', 'Kelvin']
};

var MEASUREMENT_TYPES = ['LENGTH', 'WEIGHT', 'VOLUME', 'TEMPERATURE'];
var OPERATIONS = ['Compare', 'Convert', 'Add', 'Subtract', 'Divide'];
