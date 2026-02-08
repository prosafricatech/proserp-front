export interface Currency {
	code: string;
	name: string;
	name_plural: string;
	symbol: string;
	symbol_native: string;
	decimal_digits: number;
	rounding: number;
}

export interface Country {
	name: string;
	code: string;
	capital: string;
	continent: string;
	dial_code: string;
	currency: Currency;
}

export const COUNTRIES: Country[] = [
	{
	  "name": "Afghanistan",
	  "code": "AF",
	  "capital": "Kabul",
	  "continent": "Asia",
	  "dial_code": "+93",
	  "currency": {
		"code": "AFN",
		"name": "Afghan Afghani",
		"name_plural": "Afghan Afghanis",
		"symbol": "؋",
		"symbol_native": "؋",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Albania",
	  "code": "AL",
	  "capital": "Tirana",
	  "continent": "Europe",
	  "dial_code": "+355",
	  "currency": {
		"code": "ALL",
		"name": "Albanian Lek",
		"name_plural": "Albanian lekë",
		"symbol": "L",
		"symbol_native": "L",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Algeria",
	  "code": "DZ",
	  "capital": "Algiers",
	  "continent": "Africa",
	  "dial_code": "+213",
	  "currency": {
		"code": "DZD",
		"name": "Algerian Dinar",
		"name_plural": "Algerian dinars",
		"symbol": "DA",
		"symbol_native": "د.ج.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Andorra",
	  "code": "AD",
	  "capital": "Andorra la Vella",
	  "continent": "Europe",
	  "dial_code": "+376",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Angola",
	  "code": "AO",
	  "capital": "Luanda",
	  "continent": "Africa",
	  "dial_code": "+244",
	  "currency": {
		"code": "AOA",
		"name": "Angolan Kwanza",
		"name_plural": "Angolan kwanzas",
		"symbol": "Kz",
		"symbol_native": "Kz",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Antigua and Barbuda",
	  "code": "AG",
	  "capital": "St. John's",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Argentina",
	  "code": "AR",
	  "capital": "Buenos Aires",
	  "continent": "South America",
	  "dial_code": "+54",
	  "currency": {
		"code": "ARS",
		"name": "Argentine Peso",
		"name_plural": "Argentine pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Armenia",
	  "code": "AM",
	  "capital": "Yerevan",
	  "continent": "Asia",
	  "dial_code": "+374",
	  "currency": {
		"code": "AMD",
		"name": "Armenian Dram",
		"name_plural": "Armenian drams",
		"symbol": "դր.",
		"symbol_native": "դր.",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Australia",
	  "code": "AU",
	  "capital": "Canberra",
	  "continent": "Oceania",
	  "dial_code": "+61",
	  "currency": {
		"code": "AUD",
		"name": "Australian Dollar",
		"name_plural": "Australian dollars",
		"symbol": "AU$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Austria",
	  "code": "AT",
	  "capital": "Vienna",
	  "continent": "Europe",
	  "dial_code": "+43",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Azerbaijan",
	  "code": "AZ",
	  "capital": "Baku",
	  "continent": "Asia",
	  "dial_code": "+994",
	  "currency": {
		"code": "AZN",
		"name": "Azerbaijani Manat",
		"name_plural": "Azerbaijani manats",
		"symbol": "ман.",
		"symbol_native": "ман.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Bahamas",
	  "code": "BS",
	  "capital": "Nassau",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "BSD",
		"name": "Bahamian Dollar",
		"name_plural": "Bahamian dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Bahrain",
	  "code": "BH",
	  "capital": "Manama",
	  "continent": "Asia",
	  "dial_code": "+973",
	  "currency": {
		"code": "BHD",
		"name": "Bahraini Dinar",
		"name_plural": "Bahraini dinars",
		"symbol": "BD",
		"symbol_native": "د.ب.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Bangladesh",
	  "code": "BD",
	  "capital": "Dhaka",
	  "continent": "Asia",
	  "dial_code": "+880",
	  "currency": {
		"code": "BDT",
		"name": "Bangladeshi Taka",
		"name_plural": "Bangladeshi takas",
		"symbol": "৳",
		"symbol_native": "৳",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Barbados",
	  "code": "BB",
	  "capital": "Bridgetown",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "BBD",
		"name": "Barbadian Dollar",
		"name_plural": "Barbadian dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Belarus",
	  "code": "BY",
	  "capital": "Minsk",
	  "continent": "Europe",
	  "dial_code": "+375",
	  "currency": {
		"code": "BYN",
		"name": "Belarusian Ruble",
		"name_plural": "Belarusian rubles",
		"symbol": "Br",
		"symbol_native": "руб.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Belgium",
	  "code": "BE",
	  "capital": "Brussels",
	  "continent": "Europe",
	  "dial_code": "+32",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Belize",
	  "code": "BZ",
	  "capital": "Belmopan",
	  "continent": "North America",
	  "dial_code": "+501",
	  "currency": {
		"code": "BZD",
		"name": "Belize Dollar",
		"name_plural": "Belize dollars",
		"symbol": "BZ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Benin",
	  "code": "BJ",
	  "capital": "Porto-Novo",
	  "continent": "Africa",
	  "dial_code": "+229",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Bhutan",
	  "code": "BT",
	  "capital": "Thimphu",
	  "continent": "Asia",
	  "dial_code": "+975",
	  "currency": {
		"code": "BTN",
		"name": "Bhutanese Ngultrum",
		"name_plural": "Bhutanese ngultrums",
		"symbol": "Nu.",
		"symbol_native": "Nu.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Bolivia",
	  "code": "BO",
	  "capital": "Sucre",
	  "continent": "South America",
	  "dial_code": "+591",
	  "currency": {
		"code": "BOB",
		"name": "Bolivian Boliviano",
		"name_plural": "Bolivian bolivianos",
		"symbol": "Bs.",
		"symbol_native": "Bs.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Bosnia and Herzegovina",
	  "code": "BA",
	  "capital": "Sarajevo",
	  "continent": "Europe",
	  "dial_code": "+387",
	  "currency": {
		"code": "BAM",
		"name": "Bosnia-Herzegovina Convertible Mark",
		"name_plural": "Bosnia-Herzegovina convertible marks",
		"symbol": "KM",
		"symbol_native": "KM",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Botswana",
	  "code": "BW",
	  "capital": "Gaborone",
	  "continent": "Africa",
	  "dial_code": "+267",
	  "currency": {
		"code": "BWP",
		"name": "Botswana Pula",
		"name_plural": "Botswana pulas",
		"symbol": "P",
		"symbol_native": "P",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Brazil",
	  "code": "BR",
	  "capital": "Brasília",
	  "continent": "South America",
	  "dial_code": "+55",
	  "currency": {
		"code": "BRL",
		"name": "Brazilian Real",
		"name_plural": "Brazilian reals",
		"symbol": "R$",
		"symbol_native": "R$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Brunei",
	  "code": "BN",
	  "capital": "Bandar Seri Begawan",
	  "continent": "Asia",
	  "dial_code": "+673",
	  "currency": {
		"code": "BND",
		"name": "Brunei Dollar",
		"name_plural": "Brunei dollars",
		"symbol": "B$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Bulgaria",
	  "code": "BG",
	  "capital": "Sofia",
	  "continent": "Europe",
	  "dial_code": "+359",
	  "currency": {
		"code": "BGN",
		"name": "Bulgarian Lev",
		"name_plural": "Bulgarian leva",
		"symbol": "лв.",
		"symbol_native": "лв.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Burkina Faso",
	  "code": "BF",
	  "capital": "Ouagadougou",
	  "continent": "Africa",
	  "dial_code": "+226",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Burundi",
	  "code": "BI",
	  "capital": "Bujumbura",
	  "continent": "Africa",
	  "dial_code": "+257",
	  "currency": {
		"code": "BIF",
		"name": "Burundian Franc",
		"name_plural": "Burundian francs",
		"symbol": "FBu",
		"symbol_native": "FBu",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Cabo Verde",
	  "code": "CV",
	  "capital": "Praia",
	  "continent": "Africa",
	  "dial_code": "+238",
	  "currency": {
		"code": "CVE",
		"name": "Cape Verdean Escudo",
		"name_plural": "Cape Verdean escudos",
		"symbol": "CV$",
		"symbol_native": "CV$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Cambodia",
	  "code": "KH",
	  "capital": "Phnom Penh",
	  "continent": "Asia",
	  "dial_code": "+855",
	  "currency": {
		"code": "KHR",
		"name": "Cambodian Riel",
		"name_plural": "Cambodian riels",
		"symbol": "៛",
		"symbol_native": "៛",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Cameroon",
	  "code": "CM",
	  "capital": "Yaoundé",
	  "continent": "Africa",
	  "dial_code": "+237",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Canada",
	  "code": "CA",
	  "capital": "Ottawa",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "CAD",
		"name": "Canadian Dollar",
		"name_plural": "Canadian dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Central African Republic",
	  "code": "CF",
	  "capital": "Bangui",
	  "continent": "Africa",
	  "dial_code": "+236",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Chad",
	  "code": "TD",
	  "capital": "N'Djamena",
	  "continent": "Africa",
	  "dial_code": "+235",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Chile",
	  "code": "CL",
	  "capital": "Santiago",
	  "continent": "South America",
	  "dial_code": "+56",
	  "currency": {
		"code": "CLP",
		"name": "Chilean Peso",
		"name_plural": "Chilean pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "China",
	  "code": "CN",
	  "capital": "Beijing",
	  "continent": "Asia",
	  "dial_code": "+86",
	  "currency": {
		"code": "CNY",
		"name": "Chinese Yuan",
		"name_plural": "Chinese yuan",
		"symbol": "¥",
		"symbol_native": "￥",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Colombia",
	  "code": "CO",
	  "capital": "Bogotá",
	  "continent": "South America",
	  "dial_code": "+57",
	  "currency": {
		"code": "COP",
		"name": "Colombian Peso",
		"name_plural": "Colombian pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Comoros",
	  "code": "KM",
	  "capital": "Moroni",
	  "continent": "Africa",
	  "dial_code": "+269",
	  "currency": {
		"code": "KMF",
		"name": "Comorian Franc",
		"name_plural": "Comorian francs",
		"symbol": "CF",
		"symbol_native": "FC",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Congo (Brazzaville)",
	  "code": "CG",
	  "capital": "Brazzaville",
	  "continent": "Africa",
	  "dial_code": "+242",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Congo (Kinshasa)",
	  "code": "CD",
	  "capital": "Kinshasa",
	  "continent": "Africa",
	  "dial_code": "+243",
	  "currency": {
		"code": "CDF",
		"name": "Congolese Franc",
		"name_plural": "Congolese francs",
		"symbol": "FC",
		"symbol_native": "FC",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Costa Rica",
	  "code": "CR",
	  "capital": "San José",
	  "continent": "North America",
	  "dial_code": "+506",
	  "currency": {
		"code": "CRC",
		"name": "Costa Rican Colón",
		"name_plural": "Costa Rican colóns",
		"symbol": "₡",
		"symbol_native": "₡",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Croatia",
	  "code": "HR",
	  "capital": "Zagreb",
	  "continent": "Europe",
	  "dial_code": "+385",
	  "currency": {
		"code": "HRK",
		"name": "Croatian Kuna",
		"name_plural": "Croatian kunas",
		"symbol": "kn",
		"symbol_native": "kn",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Cuba",
	  "code": "CU",
	  "capital": "Havana",
	  "continent": "North America",
	  "dial_code": "+53",
	  "currency": {
		"code": "CUP",
		"name": "Cuban Peso",
		"name_plural": "Cuban pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Cyprus",
	  "code": "CY",
	  "capital": "Nicosia",
	  "continent": "Europe",
	  "dial_code": "+357",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Czech Republic",
	  "code": "CZ",
	  "capital": "Prague",
	  "continent": "Europe",
	  "dial_code": "+420",
	  "currency": {
		"code": "CZK",
		"name": "Czech Koruna",
		"name_plural": "Czech korunas",
		"symbol": "Kč",
		"symbol_native": "Kč",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Denmark",
	  "code": "DK",
	  "capital": "Copenhagen",
	  "continent": "Europe",
	  "dial_code": "+45",
	  "currency": {
		"code": "DKK",
		"name": "Danish Krone",
		"name_plural": "Danish kroner",
		"symbol": "kr.",
		"symbol_native": "kr.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Djibouti",
	  "code": "DJ",
	  "capital": "Djibouti",
	  "continent": "Africa",
	  "dial_code": "+253",
	  "currency": {
		"code": "DJF",
		"name": "Djiboutian Franc",
		"name_plural": "Djiboutian francs",
		"symbol": "Fdj",
		"symbol_native": "Fdj",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Dominica",
	  "code": "DM",
	  "capital": "Roseau",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Dominican Republic",
	  "code": "DO",
	  "capital": "Santo Domingo",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "DOP",
		"name": "Dominican Peso",
		"name_plural": "Dominican pesos",
		"symbol": "RD$",
		"symbol_native": "RD$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Ecuador",
	  "code": "EC",
	  "capital": "Quito",
	  "continent": "South America",
	  "dial_code": "+593",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Egypt",
	  "code": "EG",
	  "capital": "Cairo",
	  "continent": "Africa",
	  "dial_code": "+20",
	  "currency": {
		"code": "EGP",
		"name": "Egyptian Pound",
		"name_plural": "Egyptian pounds",
		"symbol": "ج.م.‏",
		"symbol_native": "ج.م.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "El Salvador",
	  "code": "SV",
	  "capital": "San Salvador",
	  "continent": "North America",
	  "dial_code": "+503",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Equatorial Guinea",
	  "code": "GQ",
	  "capital": "Malabo",
	  "continent": "Africa",
	  "dial_code": "+240",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Eritrea",
	  "code": "ER",
	  "capital": "Asmara",
	  "continent": "Africa",
	  "dial_code": "+291",
	  "currency": {
		"code": "ERN",
		"name": "Eritrean Nakfa",
		"name_plural": "Eritrean nakfas",
		"symbol": "Nfk",
		"symbol_native": "Nfk",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Estonia",
	  "code": "EE",
	  "capital": "Tallinn",
	  "continent": "Europe",
	  "dial_code": "+372",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Ethiopia",
	  "code": "ET",
	  "capital": "Addis Ababa",
	  "continent": "Africa",
	  "dial_code": "+251",
	  "currency": {
		"code": "ETB",
		"name": "Ethiopian Birr",
		"name_plural": "Ethiopian birrs",
		"symbol": "Br",
		"symbol_native": "Br",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Fiji",
	  "code": "FJ",
	  "capital": "Suva",
	  "continent": "Oceania",
	  "dial_code": "+679",
	  "currency": {
		"code": "FJD",
		"name": "Fijian Dollar",
		"name_plural": "Fijian dollars",
		"symbol": "FJ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Finland",
	  "code": "FI",
	  "capital": "Helsinki",
	  "continent": "Europe",
	  "dial_code": "+358",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "France",
	  "code": "FR",
	  "capital": "Paris",
	  "continent": "Europe",
	  "dial_code": "+33",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Gabon",
	  "code": "GA",
	  "capital": "Libreville",
	  "continent": "Africa",
	  "dial_code": "+241",
	  "currency": {
		"code": "XAF",
		"name": "CFA Franc BEAC",
		"name_plural": "CFA francs BEAC",
		"symbol": "FCFA",
		"symbol_native": "FCFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Gambia",
	  "code": "GM",
	  "capital": "Banjul",
	  "continent": "Africa",
	  "dial_code": "+220",
	  "currency": {
		"code": "GMD",
		"name": "Gambian Dalasi",
		"name_plural": "Gambian dalasis",
		"symbol": "D",
		"symbol_native": "D",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Georgia",
	  "code": "GE",
	  "capital": "Tbilisi",
	  "continent": "Asia",
	  "dial_code": "+995",
	  "currency": {
		"code": "GEL",
		"name": "Georgian Lari",
		"name_plural": "Georgian laris",
		"symbol": "GEL",
		"symbol_native": "GEL",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Germany",
	  "code": "DE",
	  "capital": "Berlin",
	  "continent": "Europe",
	  "dial_code": "+49",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Ghana",
	  "code": "GH",
	  "capital": "Accra",
	  "continent": "Africa",
	  "dial_code": "+233",
	  "currency": {
		"code": "GHS",
		"name": "Ghanaian Cedi",
		"name_plural": "Ghanaian cedis",
		"symbol": "GH₵",
		"symbol_native": "GH₵",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Greece",
	  "code": "GR",
	  "capital": "Athens",
	  "continent": "Europe",
	  "dial_code": "+30",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Grenada",
	  "code": "GD",
	  "capital": "St. George's",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Guatemala",
	  "code": "GT",
	  "capital": "Guatemala City",
	  "continent": "North America",
	  "dial_code": "+502",
	  "currency": {
		"code": "GTQ",
		"name": "Guatemalan Quetzal",
		"name_plural": "Guatemalan quetzals",
		"symbol": "Q",
		"symbol_native": "Q",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Guinea",
	  "code": "GN",
	  "capital": "Conakry",
	  "continent": "Africa",
	  "dial_code": "+224",
	  "currency": {
		"code": "GNF",
		"name": "Guinean Franc",
		"name_plural": "Guinean francs",
		"symbol": "FG",
		"symbol_native": "FG",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Guinea-Bissau",
	  "code": "GW",
	  "capital": "Bissau",
	  "continent": "Africa",
	  "dial_code": "+245",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Guyana",
	  "code": "GY",
	  "capital": "Georgetown",
	  "continent": "South America",
	  "dial_code": "+592",
	  "currency": {
		"code": "GYD",
		"name": "Guyanaese Dollar",
		"name_plural": "Guyanaese dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Haiti",
	  "code": "HT",
	  "capital": "Port-au-Prince",
	  "continent": "North America",
	  "dial_code": "+509",
	  "currency": {
		"code": "HTG",
		"name": "Haitian Gourde",
		"name_plural": "Haitian gourdes",
		"symbol": "G",
		"symbol_native": "G",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Honduras",
	  "code": "HN",
	  "capital": "Tegucigalpa",
	  "continent": "North America",
	  "dial_code": "+504",
	  "currency": {
		"code": "HNL",
		"name": "Honduran Lempira",
		"name_plural": "Honduran lempiras",
		"symbol": "L",
		"symbol_native": "L",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Hungary",
	  "code": "HU",
	  "capital": "Budapest",
	  "continent": "Europe",
	  "dial_code": "+36",
	  "currency": {
		"code": "HUF",
		"name": "Hungarian Forint",
		"name_plural": "Hungarian forints",
		"symbol": "Ft",
		"symbol_native": "Ft",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Iceland",
	  "code": "IS",
	  "capital": "Reykjavik",
	  "continent": "Europe",
	  "dial_code": "+354",
	  "currency": {
		"code": "ISK",
		"name": "Icelandic Króna",
		"name_plural": "Icelandic krónur",
		"symbol": "Ikr",
		"symbol_native": "kr",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "India",
	  "code": "IN",
	  "capital": "New Delhi",
	  "continent": "Asia",
	  "dial_code": "+91",
	  "currency": {
		"code": "INR",
		"name": "Indian Rupee",
		"name_plural": "Indian rupees",
		"symbol": "₹",
		"symbol_native": "টকা",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Indonesia",
	  "code": "ID",
	  "capital": "Jakarta",
	  "continent": "Asia",
	  "dial_code": "+62",
	  "currency": {
		"code": "IDR",
		"name": "Indonesian Rupiah",
		"name_plural": "Indonesian rupiahs",
		"symbol": "Rp",
		"symbol_native": "Rp",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Iran",
	  "code": "IR",
	  "capital": "Tehran",
	  "continent": "Asia",
	  "dial_code": "+98",
	  "currency": {
		"code": "IRR",
		"name": "Iranian Rial",
		"name_plural": "Iranian rials",
		"symbol": "﷼",
		"symbol_native": "﷼",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Iraq",
	  "code": "IQ",
	  "capital": "Baghdad",
	  "continent": "Asia",
	  "dial_code": "+964",
	  "currency": {
		"code": "IQD",
		"name": "Iraqi Dinar",
		"name_plural": "Iraqi dinars",
		"symbol": "د.ع.‏",
		"symbol_native": "د.ع.‏",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Ireland",
	  "code": "IE",
	  "capital": "Dublin",
	  "continent": "Europe",
	  "dial_code": "+353",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Israel",
	  "code": "IL",
	  "capital": "Jerusalem",
	  "continent": "Asia",
	  "dial_code": "+972",
	  "currency": {
		"code": "ILS",
		"name": "Israeli New Shekel",
		"name_plural": "Israeli new shekels",
		"symbol": "₪",
		"symbol_native": "₪",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Italy",
	  "code": "IT",
	  "capital": "Rome",
	  "continent": "Europe",
	  "dial_code": "+39",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Jamaica",
	  "code": "JM",
	  "capital": "Kingston",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "JMD",
		"name": "Jamaican Dollar",
		"name_plural": "Jamaican dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Japan",
	  "code": "JP",
	  "capital": "Tokyo",
	  "continent": "Asia",
	  "dial_code": "+81",
	  "currency": {
		"code": "JPY",
		"name": "Japanese Yen",
		"name_plural": "Japanese yen",
		"symbol": "¥",
		"symbol_native": "￥",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Jordan",
	  "code": "JO",
	  "capital": "Amman",
	  "continent": "Asia",
	  "dial_code": "+962",
	  "currency": {
		"code": "JOD",
		"name": "Jordanian Dinar",
		"name_plural": "Jordanian dinars",
		"symbol": "JD",
		"symbol_native": "د.أ.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Kazakhstan",
	  "code": "KZ",
	  "capital": "Astana",
	  "continent": "Asia",
	  "dial_code": "+7",
	  "currency": {
		"code": "KZT",
		"name": "Kazakhstani Tenge",
		"name_plural": "Kazakhstani tenges",
		"symbol": "KZT",
		"symbol_native": "тңг.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Kenya",
	  "code": "KE",
	  "capital": "Nairobi",
	  "continent": "Africa",
	  "dial_code": "+254",
	  "currency": {
		"code": "KES",
		"name": "Kenyan Shilling",
		"name_plural": "Kenyan shillings",
		"symbol": "KSh",
		"symbol_native": "KSh",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Kiribati",
	  "code": "KI",
	  "capital": "Tarawa",
	  "continent": "Oceania",
	  "dial_code": "+686",
	  "currency": {
		"code": "AUD",
		"name": "Australian Dollar",
		"name_plural": "Australian dollars",
		"symbol": "AU$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Kuwait",
	  "code": "KW",
	  "capital": "Kuwait City",
	  "continent": "Asia",
	  "dial_code": "+965",
	  "currency": {
		"code": "KWD",
		"name": "Kuwaiti Dinar",
		"name_plural": "Kuwaiti dinars",
		"symbol": "KD",
		"symbol_native": "د.ك.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Kyrgyzstan",
	  "code": "KG",
	  "capital": "Bishkek",
	  "continent": "Asia",
	  "dial_code": "+996",
	  "currency": {
		"code": "KGS",
		"name": "Kyrgyzstani Som",
		"name_plural": "Kyrgyzstani soms",
		"symbol": "KGS",
		"symbol_native": "сом",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Laos",
	  "code": "LA",
	  "capital": "Vientiane",
	  "continent": "Asia",
	  "dial_code": "+856",
	  "currency": {
		"code": "LAK",
		"name": "Laotian Kip",
		"name_plural": "Laotian kips",
		"symbol": "₭",
		"symbol_native": "₭",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Latvia",
	  "code": "LV",
	  "capital": "Riga",
	  "continent": "Europe",
	  "dial_code": "+371",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Lebanon",
	  "code": "LB",
	  "capital": "Beirut",
	  "continent": "Asia",
	  "dial_code": "+961",
	  "currency": {
		"code": "LBP",
		"name": "Lebanese Pound",
		"name_plural": "Lebanese pounds",
		"symbol": "ل.ل.‏",
		"symbol_native": "ل.ل.‏",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Lesotho",
	  "code": "LS",
	  "capital": "Maseru",
	  "continent": "Africa",
	  "dial_code": "+266",
	  "currency": {
		"code": "LSL",
		"name": "Lesotho Loti",
		"name_plural": "Lesotho lotis",
		"symbol": "LSL",
		"symbol_native": "LSL",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Liberia",
	  "code": "LR",
	  "capital": "Monrovia",
	  "continent": "Africa",
	  "dial_code": "+231",
	  "currency": {
		"code": "LRD",
		"name": "Liberian Dollar",
		"name_plural": "Liberian dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Libya",
	  "code": "LY",
	  "capital": "Tripoli",
	  "continent": "Africa",
	  "dial_code": "+218",
	  "currency": {
		"code": "LYD",
		"name": "Libyan Dinar",
		"name_plural": "Libyan dinars",
		"symbol": "د.ل.‏",
		"symbol_native": "د.ل.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Liechtenstein",
	  "code": "LI",
	  "capital": "Vaduz",
	  "continent": "Europe",
	  "dial_code": "+423",
	  "currency": {
		"code": "CHF",
		"name": "Swiss Franc",
		"name_plural": "Swiss francs",
		"symbol": "CHF",
		"symbol_native": "CHF",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Lithuania",
	  "code": "LT",
	  "capital": "Vilnius",
	  "continent": "Europe",
	  "dial_code": "+370",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Luxembourg",
	  "code": "LU",
	  "capital": "Luxembourg",
	  "continent": "Europe",
	  "dial_code": "+352",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Macao",
	  "code": "MO",
	  "capital": "",
	  "continent": "Asia",
	  "dial_code": "+853",
	  "currency": {
		"code": "MOP",
		"name": "Macanese Pataca",
		"name_plural": "Macanese patacas",
		"symbol": "MOP$",
		"symbol_native": "MOP$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Madagascar",
	  "code": "MG",
	  "capital": "Antananarivo",
	  "continent": "Africa",
	  "dial_code": "+261",
	  "currency": {
		"code": "MGA",
		"name": "Malagasy Ariary",
		"name_plural": "Malagasy Ariaries",
		"symbol": "Ar",
		"symbol_native": "Ar",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Malawi",
	  "code": "MW",
	  "capital": "Lilongwe",
	  "continent": "Africa",
	  "dial_code": "+265",
	  "currency": {
		"code": "MWK",
		"name": "Malawian Kwacha",
		"name_plural": "Malawian kwachas",
		"symbol": "MK",
		"symbol_native": "MK",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Malaysia",
	  "code": "MY",
	  "capital": "Kuala Lumpur",
	  "continent": "Asia",
	  "dial_code": "+60",
	  "currency": {
		"code": "MYR",
		"name": "Malaysian Ringgit",
		"name_plural": "Malaysian ringgits",
		"symbol": "RM",
		"symbol_native": "RM",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Maldives",
	  "code": "MV",
	  "capital": "Malé",
	  "continent": "Asia",
	  "dial_code": "+960",
	  "currency": {
		"code": "MVR",
		"name": "Maldivian Rufiyaa",
		"name_plural": "Maldivian rufiyaas",
		"symbol": "MVR",
		"symbol_native": "ރ.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Mali",
	  "code": "ML",
	  "capital": "Bamako",
	  "continent": "Africa",
	  "dial_code": "+223",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Malta",
	  "code": "MT",
	  "capital": "Valletta",
	  "continent": "Europe",
	  "dial_code": "+356",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Marshall Islands",
	  "code": "MH",
	  "capital": "Majuro",
	  "continent": "Oceania",
	  "dial_code": "+692",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Martinique",
	  "code": "MQ",
	  "capital": "Fort-de-France",
	  "continent": "North America",
	  "dial_code": "+596",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Mauritania",
	  "code": "MR",
	  "capital": "Nouakchott",
	  "continent": "Africa",
	  "dial_code": "+222",
	  "currency": {
		"code": "MRO",
		"name": "Mauritanian Ouguiya",
		"name_plural": "Mauritanian ouguiyas",
		"symbol": "UM",
		"symbol_native": "أ.م.",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Mauritius",
	  "code": "MU",
	  "capital": "Port Louis",
	  "continent": "Africa",
	  "dial_code": "+230",
	  "currency": {
		"code": "MUR",
		"name": "Mauritian Rupee",
		"name_plural": "Mauritian rupees",
		"symbol": "₨",
		"symbol_native": "₨",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Mayotte",
	  "code": "YT",
	  "capital": "Mamoudzou",
	  "continent": "Africa",
	  "dial_code": "+262",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Mexico",
	  "code": "MX",
	  "capital": "Mexico City",
	  "continent": "North America",
	  "dial_code": "+52",
	  "currency": {
		"code": "MXN",
		"name": "Mexican Peso",
		"name_plural": "Mexican pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Micronesia",
	  "code": "FM",
	  "capital": "Palikir",
	  "continent": "Oceania",
	  "dial_code": "+691",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Moldova",
	  "code": "MD",
	  "capital": "Chișinău",
	  "continent": "Europe",
	  "dial_code": "+373",
	  "currency": {
		"code": "MDL",
		"name": "Moldovan Leu",
		"name_plural": "Moldovan lei",
		"symbol": "MDL",
		"symbol_native": "MDL",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Monaco",
	  "code": "MC",
	  "capital": "Monaco",
	  "continent": "Europe",
	  "dial_code": "+377",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Mongolia",
	  "code": "MN",
	  "capital": "Ulan Bator",
	  "continent": "Asia",
	  "dial_code": "+976",
	  "currency": {
		"code": "MNT",
		"name": "Mongolian Tugrik",
		"name_plural": "Mongolian tugriks",
		"symbol": "₮",
		"symbol_native": "₮",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Montenegro",
	  "code": "ME",
	  "capital": "Podgorica",
	  "continent": "Europe",
	  "dial_code": "+382",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Montserrat",
	  "code": "MS",
	  "capital": "Plymouth",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Morocco",
	  "code": "MA",
	  "capital": "Rabat",
	  "continent": "Africa",
	  "dial_code": "+212",
	  "currency": {
		"code": "MAD",
		"name": "Moroccan Dirham",
		"name_plural": "Moroccan dirhams",
		"symbol": "MAD",
		"symbol_native": "د.م.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Mozambique",
	  "code": "MZ",
	  "capital": "Maputo",
	  "continent": "Africa",
	  "dial_code": "+258",
	  "currency": {
		"code": "MZN",
		"name": "Mozambican Metical",
		"name_plural": "Mozambican meticals",
		"symbol": "MTn",
		"symbol_native": "MTn",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Myanmar",
	  "code": "MM",
	  "capital": "Naypyidaw",
	  "continent": "Asia",
	  "dial_code": "+95",
	  "currency": {
		"code": "MMK",
		"name": "Burmese Kyat",
		"name_plural": "Burmese kyats",
		"symbol": "K",
		"symbol_native": "K",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Namibia",
	  "code": "NA",
	  "capital": "Windhoek",
	  "continent": "Africa",
	  "dial_code": "+264",
	  "currency": {
		"code": "NAD",
		"name": "Namibian Dollar",
		"name_plural": "Namibian dollars",
		"symbol": "$",
		"symbol_native": "N$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Nauru",
	  "code": "NR",
	  "capital": "Yaren",
	  "continent": "Oceania",
	  "dial_code": "+674",
	  "currency": {
		"code": "AUD",
		"name": "Australian Dollar",
		"name_plural": "Australian dollars",
		"symbol": "AU$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Nepal",
	  "code": "NP",
	  "capital": "Kathmandu",
	  "continent": "Asia",
	  "dial_code": "+977",
	  "currency": {
		"code": "NPR",
		"name": "Nepalese Rupee",
		"name_plural": "Nepalese rupees",
		"symbol": "रु",
		"symbol_native": "रु",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Netherlands",
	  "code": "NL",
	  "capital": "Amsterdam",
	  "continent": "Europe",
	  "dial_code": "+31",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "New Caledonia",
	  "code": "NC",
	  "capital": "Nouméa",
	  "continent": "Oceania",
	  "dial_code": "+687",
	  "currency": {
		"code": "XPF",
		"name": "CFP Franc",
		"name_plural": "CFP francs",
		"symbol": "CFPF",
		"symbol_native": "XPF",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "New Zealand",
	  "code": "NZ",
	  "capital": "Wellington",
	  "continent": "Oceania",
	  "dial_code": "+64",
	  "currency": {
		"code": "NZD",
		"name": "New Zealand Dollar",
		"name_plural": "New Zealand dollars",
		"symbol": "NZ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Nicaragua",
	  "code": "NI",
	  "capital": "Managua",
	  "continent": "North America",
	  "dial_code": "+505",
	  "currency": {
		"code": "NIO",
		"name": "Nicaraguan Córdoba",
		"name_plural": "Nicaraguan córdobas",
		"symbol": "C$",
		"symbol_native": "C$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Niger",
	  "code": "NE",
	  "capital": "Niamey",
	  "continent": "Africa",
	  "dial_code": "+227",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Nigeria",
	  "code": "NG",
	  "capital": "Abuja",
	  "continent": "Africa",
	  "dial_code": "+234",
	  "currency": {
		"code": "NGN",
		"name": "Nigerian Naira",
		"name_plural": "Nigerian nairas",
		"symbol": "₦",
		"symbol_native": "₦",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Niue",
	  "code": "NU",
	  "capital": "Alofi",
	  "continent": "Oceania",
	  "dial_code": "+683",
	  "currency": {
		"code": "NZD",
		"name": "New Zealand Dollar",
		"name_plural": "New Zealand dollars",
		"symbol": "NZ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Norfolk Island",
	  "code": "NF",
	  "capital": "Kingston",
	  "continent": "Oceania",
	  "dial_code": "+672",
	  "currency": {
		"code": "AUD",
		"name": "Australian Dollar",
		"name_plural": "Australian dollars",
		"symbol": "AU$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "North Korea",
	  "code": "KP",
	  "capital": "Pyongyang",
	  "continent": "Asia",
	  "dial_code": "+850",
	  "currency": {
		"code": "KPW",
		"name": "North Korean Won",
		"name_plural": "North Korean won",
		"symbol": "₩",
		"symbol_native": "₩",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "North Macedonia",
	  "code": "MK",
	  "capital": "Skopje",
	  "continent": "Europe",
	  "dial_code": "+389",
	  "currency": {
		"code": "MKD",
		"name": "Macedonian Denar",
		"name_plural": "Macedonian denari",
		"symbol": "ден",
		"symbol_native": "ден",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Northern Mariana Islands",
	  "code": "MP",
	  "capital": "Saipan",
	  "continent": "Oceania",
	  "dial_code": "+1",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Norway",
	  "code": "NO",
	  "capital": "Oslo",
	  "continent": "Europe",
	  "dial_code": "+47",
	  "currency": {
		"code": "NOK",
		"name": "Norwegian Krone",
		"name_plural": "Norwegian kroner",
		"symbol": "kr",
		"symbol_native": "kr",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Oman",
	  "code": "OM",
	  "capital": "Muscat",
	  "continent": "Asia",
	  "dial_code": "+968",
	  "currency": {
		"code": "OMR",
		"name": "Omani Rial",
		"name_plural": "Omani rials",
		"symbol": "ر.ع.‏",
		"symbol_native": "ر.ع.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Pakistan",
	  "code": "PK",
	  "capital": "Islamabad",
	  "continent": "Asia",
	  "dial_code": "+92",
	  "currency": {
		"code": "PKR",
		"name": "Pakistani Rupee",
		"name_plural": "Pakistani rupees",
		"symbol": "Rs",
		"symbol_native": "₨",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Palau",
	  "code": "PW",
	  "capital": "Ngerulmud",
	  "continent": "Oceania",
	  "dial_code": "+680",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Palestine",
	  "code": "PS",
	  "capital": "Ramallah",
	  "continent": "Asia",
	  "dial_code": "+970",
	  "currency": {
		"code": "ILS",
		"name": "Israeli New Sheqel",
		"name_plural": "Israeli new sheqels",
		"symbol": "₪",
		"symbol_native": "₪",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Panama",
	  "code": "PA",
	  "capital": "Panama City",
	  "continent": "North America",
	  "dial_code": "+507",
	  "currency": {
		"code": "PAB",
		"name": "Panamanian Balboa",
		"name_plural": "Panamanian balboas",
		"symbol": "B/.",
		"symbol_native": "B/.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Papua New Guinea",
	  "code": "PG",
	  "capital": "Port Moresby",
	  "continent": "Oceania",
	  "dial_code": "+675",
	  "currency": {
		"code": "PGK",
		"name": "Papua New Guinean Kina",
		"name_plural": "Papua New Guinean kina",
		"symbol": "PGK",
		"symbol_native": "K",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Paraguay",
	  "code": "PY",
	  "capital": "Asunción",
	  "continent": "South America",
	  "dial_code": "+595",
	  "currency": {
		"code": "PYG",
		"name": "Paraguayan Guarani",
		"name_plural": "Paraguayan guaranis",
		"symbol": "₲",
		"symbol_native": "₲",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Peru",
	  "code": "PE",
	  "capital": "Lima",
	  "continent": "South America",
	  "dial_code": "+51",
	  "currency": {
		"code": "PEN",
		"name": "Peruvian Nuevo Sol",
		"name_plural": "Peruvian nuevos soles",
		"symbol": "S/.",
		"symbol_native": "S/.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Philippines",
	  "code": "PH",
	  "capital": "Manila",
	  "continent": "Asia",
	  "dial_code": "+63",
	  "currency": {
		"code": "PHP",
		"name": "Philippine Peso",
		"name_plural": "Philippine pesos",
		"symbol": "₱",
		"symbol_native": "₱",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Pitcairn Islands",
	  "code": "PN",
	  "capital": "Adamstown",
	  "continent": "Oceania",
	  "dial_code": "+64",
	  "currency": {
		"code": "NZD",
		"name": "New Zealand Dollar",
		"name_plural": "New Zealand dollars",
		"symbol": "NZ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Poland",
	  "code": "PL",
	  "capital": "Warsaw",
	  "continent": "Europe",
	  "dial_code": "+48",
	  "currency": {
		"code": "PLN",
		"name": "Polish Zloty",
		"name_plural": "Polish zlotys",
		"symbol": "zł",
		"symbol_native": "zł",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Portugal",
	  "code": "PT",
	  "capital": "Lisbon",
	  "continent": "Europe",
	  "dial_code": "+351",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Puerto Rico",
	  "code": "PR",
	  "capital": "San Juan",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Qatar",
	  "code": "QA",
	  "capital": "Doha",
	  "continent": "Asia",
	  "dial_code": "+974",
	  "currency": {
		"code": "QAR",
		"name": "Qatari Rial",
		"name_plural": "Qatari rials",
		"symbol": "ر.ق.‏",
		"symbol_native": "ر.ق.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Réunion",
	  "code": "RE",
	  "capital": "Saint-Denis",
	  "continent": "Africa",
	  "dial_code": "+262",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Romania",
	  "code": "RO",
	  "capital": "Bucharest",
	  "continent": "Europe",
	  "dial_code": "+40",
	  "currency": {
		"code": "RON",
		"name": "Romanian Leu",
		"name_plural": "Romanian lei",
		"symbol": "RON",
		"symbol_native": "RON",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Russia",
	  "code": "RU",
	  "capital": "Moscow",
	  "continent": "Europe",
	  "dial_code": "+7",
	  "currency": {
		"code": "RUB",
		"name": "Russian Ruble",
		"name_plural": "Russian rubles",
		"symbol": "₽",
		"symbol_native": "₽",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Rwanda",
	  "code": "RW",
	  "capital": "Kigali",
	  "continent": "Africa",
	  "dial_code": "+250",
	  "currency": {
		"code": "RWF",
		"name": "Rwandan Franc",
		"name_plural": "Rwandan francs",
		"symbol": "FR",
		"symbol_native": "FR",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Barthélemy",
	  "code": "BL",
	  "capital": "Gustavia",
	  "continent": "North America",
	  "dial_code": "+590",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Helena",
	  "code": "SH",
	  "capital": "Jamestown",
	  "continent": "Africa",
	  "dial_code": "+290",
	  "currency": {
		"code": "SHP",
		"name": "Saint Helena Pound",
		"name_plural": "Saint Helena pounds",
		"symbol": "£",
		"symbol_native": "£",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Kitts and Nevis",
	  "code": "KN",
	  "capital": "Basseterre",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Lucia",
	  "code": "LC",
	  "capital": "Castries",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Martin",
	  "code": "MF",
	  "capital": "Marigot",
	  "continent": "North America",
	  "dial_code": "+590",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Pierre and Miquelon",
	  "code": "PM",
	  "capital": "Saint-Pierre",
	  "continent": "North America",
	  "dial_code": "+508",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saint Vincent and the Grenadines",
	  "code": "VC",
	  "capital": "Kingstown",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "XCD",
		"name": "East Caribbean Dollar",
		"name_plural": "East Caribbean Dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Samoa",
	  "code": "WS",
	  "capital": "Apia",
	  "continent": "Oceania",
	  "dial_code": "+685",
	  "currency": {
		"code": "WST",
		"name": "Samoan Tala",
		"name_plural": "Samoan tala",
		"symbol": "WS$",
		"symbol_native": "T",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "San Marino",
	  "code": "SM",
	  "capital": "San Marino",
	  "continent": "Europe",
	  "dial_code": "+378",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "São Tomé and Príncipe",
	  "code": "ST",
	  "capital": "São Tomé",
	  "continent": "Africa",
	  "dial_code": "+239",
	  "currency": {
		"code": "STD",
		"name": "São Tomé and Príncipe Dobra",
		"name_plural": "São Tomé and Príncipe dobras",
		"symbol": "Db",
		"symbol_native": "Db",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Saudi Arabia",
	  "code": "SA",
	  "capital": "Riyadh",
	  "continent": "Asia",
	  "dial_code": "+966",
	  "currency": {
		"code": "SAR",
		"name": "Saudi Riyal",
		"name_plural": "Saudi riyals",
		"symbol": "ر.س.‏",
		"symbol_native": "ر.س.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Senegal",
	  "code": "SN",
	  "capital": "Dakar",
	  "continent": "Africa",
	  "dial_code": "+221",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Serbia",
	  "code": "RS",
	  "capital": "Belgrade",
	  "continent": "Europe",
	  "dial_code": "+381",
	  "currency": {
		"code": "RSD",
		"name": "Serbian Dinar",
		"name_plural": "Serbian dinars",
		"symbol": "дин.",
		"symbol_native": "дин.",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Seychelles",
	  "code": "SC",
	  "capital": "Victoria",
	  "continent": "Africa",
	  "dial_code": "+248",
	  "currency": {
		"code": "SCR",
		"name": "Seychellois Rupee",
		"name_plural": "Seychellois rupees",
		"symbol": "SRe",
		"symbol_native": "SRe",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Sierra Leone",
	  "code": "SL",
	  "capital": "Freetown",
	  "continent": "Africa",
	  "dial_code": "+232",
	  "currency": {
		"code": "SLL",
		"name": "Sierra Leonean Leone",
		"name_plural": "Sierra Leonean leones",
		"symbol": "Le",
		"symbol_native": "Le",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Singapore",
	  "code": "SG",
	  "capital": "Singapore",
	  "continent": "Asia",
	  "dial_code": "+65",
	  "currency": {
		"code": "SGD",
		"name": "Singapore Dollar",
		"name_plural": "Singapore dollars",
		"symbol": "S$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Sint Maarten",
	  "code": "SX",
	  "capital": "Philipsburg",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "ANG",
		"name": "Netherlands Antillean Guilder",
		"name_plural": "Netherlands Antillean guilders",
		"symbol": "NAf.",
		"symbol_native": "NAf.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Slovakia",
	  "code": "SK",
	  "capital": "Bratislava",
	  "continent": "Europe",
	  "dial_code": "+421",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Slovenia",
	  "code": "SI",
	  "capital": "Ljubljana",
	  "continent": "Europe",
	  "dial_code": "+386",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Solomon Islands",
	  "code": "SB",
	  "capital": "Honiara",
	  "continent": "Oceania",
	  "dial_code": "+677",
	  "currency": {
		"code": "SBD",
		"name": "Solomon Islands Dollar",
		"name_plural": "Solomon Islands dollars",
		"symbol": "SI$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Somalia",
	  "code": "SO",
	  "capital": "Mogadishu",
	  "continent": "Africa",
	  "dial_code": "+252",
	  "currency": {
		"code": "SOS",
		"name": "Somali Shilling",
		"name_plural": "Somali shillings",
		"symbol": "Sh.So.",
		"symbol_native": "Sh.So.",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "South Africa",
	  "code": "ZA",
	  "capital": "Pretoria",
	  "continent": "Africa",
	  "dial_code": "+27",
	  "currency": {
		"code": "ZAR",
		"name": "South African Rand",
		"name_plural": "South African rand",
		"symbol": "R",
		"symbol_native": "R",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "South Georgia and the South Sandwich Islands",
	  "code": "GS",
	  "capital": "King Edward Point",
	  "continent": "Antarctica",
	  "dial_code": "+500",
	  "currency": {
		"code": "GBP",
		"name": "British Pound",
		"name_plural": "British pounds",
		"symbol": "£",
		"symbol_native": "£",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "South Korea",
	  "code": "KR",
	  "capital": "Seoul",
	  "continent": "Asia",
	  "dial_code": "+82",
	  "currency": {
		"code": "KRW",
		"name": "South Korean Won",
		"name_plural": "South Korean won",
		"symbol": "₩",
		"symbol_native": "₩",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "South Sudan",
	  "code": "SS",
	  "capital": "Juba",
	  "continent": "Africa",
	  "dial_code": "+211",
	  "currency": {
		"code": "SSP",
		"name": "South Sudanese Pound",
		"name_plural": "South Sudanese pounds",
		"symbol": "£",
		"symbol_native": "£",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Spain",
	  "code": "ES",
	  "capital": "Madrid",
	  "continent": "Europe",
	  "dial_code": "+34",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Sri Lanka",
	  "code": "LK",
	  "capital": "Colombo",
	  "continent": "Asia",
	  "dial_code": "+94",
	  "currency": {
		"code": "LKR",
		"name": "Sri Lankan Rupee",
		"name_plural": "Sri Lankan rupees",
		"symbol": "Rs",
		"symbol_native": "රු",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Sudan",
	  "code": "SD",
	  "capital": "Khartoum",
	  "continent": "Africa",
	  "dial_code": "+249",
	  "currency": {
		"code": "SDG",
		"name": "Sudanese Pound",
		"name_plural": "Sudanese pounds",
		"symbol": "SDG",
		"symbol_native": "SDG",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Suriname",
	  "code": "SR",
	  "capital": "Paramaribo",
	  "continent": "South America",
	  "dial_code": "+597",
	  "currency": {
		"code": "SRD",
		"name": "Surinamese Dollar",
		"name_plural": "Surinamese dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Svalbard and Jan Mayen",
	  "code": "SJ",
	  "capital": "Longyearbyen",
	  "continent": "Europe",
	  "dial_code": "+47",
	  "currency": {
		"code": "NOK",
		"name": "Norwegian Krone",
		"name_plural": "Norwegian kroner",
		"symbol": "kr",
		"symbol_native": "kr",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Swaziland",
	  "code": "SZ",
	  "capital": "Lobamba",
	  "continent": "Africa",
	  "dial_code": "+268",
	  "currency": {
		"code": "SZL",
		"name": "Swazi Lilangeni",
		"name_plural": "Swazi emalangeni",
		"symbol": "E",
		"symbol_native": "E",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Sweden",
	  "code": "SE",
	  "capital": "Stockholm",
	  "continent": "Europe",
	  "dial_code": "+46",
	  "currency": {
		"code": "SEK",
		"name": "Swedish Krona",
		"name_plural": "Swedish kronor",
		"symbol": "kr",
		"symbol_native": "kr",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Switzerland",
	  "code": "CH",
	  "capital": "Bern",
	  "continent": "Europe",
	  "dial_code": "+41",
	  "currency": {
		"code": "CHF",
		"name": "Swiss Franc",
		"name_plural": "Swiss francs",
		"symbol": "CHF",
		"symbol_native": "CHF",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Syria",
	  "code": "SY",
	  "capital": "Damascus",
	  "continent": "Asia",
	  "dial_code": "+963",
	  "currency": {
		"code": "SYP",
		"name": "Syrian Pound",
		"name_plural": "Syrian pounds",
		"symbol": "£S",
		"symbol_native": "ل.س.‏",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Taiwan",
	  "code": "TW",
	  "capital": "Taipei",
	  "continent": "Asia",
	  "dial_code": "+886",
	  "currency": {
		"code": "TWD",
		"name": "New Taiwan Dollar",
		"name_plural": "New Taiwan dollars",
		"symbol": "NT$",
		"symbol_native": "NT$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Tajikistan",
	  "code": "TJ",
	  "capital": "Dushanbe",
	  "continent": "Asia",
	  "dial_code": "+992",
	  "currency": {
		"code": "TJS",
		"name": "Tajikistani Somoni",
		"name_plural": "Tajikistani somonis",
		"symbol": "TJS",
		"symbol_native": "смн",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Tanzania",
	  "code": "TZ",
	  "capital": "Dodoma",
	  "continent": "Africa",
	  "dial_code": "+255",
	  "currency": {
		"code": "TZS",
		"name": "Tanzanian Shilling",
		"name_plural": "Tanzanian shillings",
		"symbol": "TSh",
		"symbol_native": "TSh",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Thailand",
	  "code": "TH",
	  "capital": "Bangkok",
	  "continent": "Asia",
	  "dial_code": "+66",
	  "currency": {
		"code": "THB",
		"name": "Thai Baht",
		"name_plural": "Thai baht",
		"symbol": "฿",
		"symbol_native": "฿",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Timor-Leste",
	  "code": "TL",
	  "capital": "Dili",
	  "continent": "Asia",
	  "dial_code": "+670",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Togo",
	  "code": "TG",
	  "capital": "Lomé",
	  "continent": "Africa",
	  "dial_code": "+228",
	  "currency": {
		"code": "XOF",
		"name": "CFA Franc BCEAO",
		"name_plural": "CFA francs BCEAO",
		"symbol": "CFA",
		"symbol_native": "CFA",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Tokelau",
	  "code": "TK",
	  "capital": "Fakaofo",
	  "continent": "Oceania",
	  "dial_code": "+690",
	  "currency": {
		"code": "NZD",
		"name": "New Zealand Dollar",
		"name_plural": "New Zealand dollars",
		"symbol": "NZ$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Tonga",
	  "code": "TO",
	  "capital": "Nuku'alofa",
	  "continent": "Oceania",
	  "dial_code": "+676",
	  "currency": {
		"code": "TOP",
		"name": "Tongan Pa'anga",
		"name_plural": "Tongan pa'anga",
		"symbol": "T$",
		"symbol_native": "T$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Trinidad and Tobago",
	  "code": "TT",
	  "capital": "Port of Spain",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "TTD",
		"name": "Trinidad and Tobago Dollar",
		"name_plural": "Trinidad and Tobago dollars",
		"symbol": "TT$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Tunisia",
	  "code": "TN",
	  "capital": "Tunis",
	  "continent": "Africa",
	  "dial_code": "+216",
	  "currency": {
		"code": "TND",
		"name": "Tunisian Dinar",
		"name_plural": "Tunisian dinars",
		"symbol": "DT",
		"symbol_native": "د.ت.‏",
		"decimal_digits": 3,
		"rounding": 0
	  }
	},
	{
	  "name": "Turkey",
	  "code": "TR",
	  "capital": "Ankara",
	  "continent": "Asia",
	  "dial_code": "+90",
	  "currency": {
		"code": "TRY",
		"name": "Turkish Lira",
		"name_plural": "Turkish Lira",
		"symbol": "₺",
		"symbol_native": "₺",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Turkmenistan",
	  "code": "TM",
	  "capital": "Ashgabat",
	  "continent": "Asia",
	  "dial_code": "+993",
	  "currency": {
		"code": "TMT",
		"name": "Turkmenistani Manat",
		"name_plural": "Turkmenistani manat",
		"symbol": "TMT",
		"symbol_native": "TMT",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Turks and Caicos Islands",
	  "code": "TC",
	  "capital": "Cockburn Town",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Tuvalu",
	  "code": "TV",
	  "capital": "Funafuti",
	  "continent": "Oceania",
	  "dial_code": "+688",
	  "currency": {
		"code": "AUD",
		"name": "Australian Dollar",
		"name_plural": "Australian dollars",
		"symbol": "AU$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "U.S. Virgin Islands",
	  "code": "VI",
	  "capital": "Charlotte Amalie",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Uganda",
	  "code": "UG",
	  "capital": "Kampala",
	  "continent": "Africa",
	  "dial_code": "+256",
	  "currency": {
		"code": "UGX",
		"name": "Ugandan Shilling",
		"name_plural": "Ugandan shillings",
		"symbol": "USh",
		"symbol_native": "USh",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Ukraine",
	  "code": "UA",
	  "capital": "Kyiv",
	  "continent": "Europe",
	  "dial_code": "+380",
	  "currency": {
		"code": "UAH",
		"name": "Ukrainian Hryvnia",
		"name_plural": "Ukrainian hryvnias",
		"symbol": "₴",
		"symbol_native": "₴",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "United Arab Emirates",
	  "code": "AE",
	  "capital": "Abu Dhabi",
	  "continent": "Asia",
	  "dial_code": "+971",
	  "currency": {
		"code": "AED",
		"name": "United Arab Emirates Dirham",
		"name_plural": "UAE dirhams",
		"symbol": "AED",
		"symbol_native": "د.إ.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "United Kingdom",
	  "code": "GB",
	  "capital": "London",
	  "continent": "Europe",
	  "dial_code": "+44",
	  "currency": {
		"code": "GBP",
		"name": "British Pound",
		"name_plural": "British pounds",
		"symbol": "£",
		"symbol_native": "£",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "United States",
	  "code": "US",
	  "capital": "Washington",
	  "continent": "North America",
	  "dial_code": "+1",
	  "currency": {
		"code": "USD",
		"name": "US Dollar",
		"name_plural": "US dollars",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Uruguay",
	  "code": "UY",
	  "capital": "Montevideo",
	  "continent": "South America",
	  "dial_code": "+598",
	  "currency": {
		"code": "UYU",
		"name": "Uruguayan Peso",
		"name_plural": "Uruguayan pesos",
		"symbol": "$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Uzbekistan",
	  "code": "UZ",
	  "capital": "Tashkent",
	  "continent": "Asia",
	  "dial_code": "+998",
	  "currency": {
		"code": "UZS",
		"name": "Uzbekistani Som",
		"name_plural": "Uzbekistani som",
		"symbol": "UZS",
		"symbol_native": "UZS",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Vanuatu",
	  "code": "VU",
	  "capital": "Port Vila",
	  "continent": "Oceania",
	  "dial_code": "+678",
	  "currency": {
		"code": "VUV",
		"name": "Vanuatu Vatu",
		"name_plural": "Vanuatu vatus",
		"symbol": "VT",
		"symbol_native": "VT",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Vatican City",
	  "code": "VA",
	  "capital": "Vatican City",
	  "continent": "Europe",
	  "dial_code": "+379",
	  "currency": {
		"code": "EUR",
		"name": "Euro",
		"name_plural": "euros",
		"symbol": "€",
		"symbol_native": "€",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Venezuela",
	  "code": "VE",
	  "capital": "Caracas",
	  "continent": "South America",
	  "dial_code": "+58",
	  "currency": {
		"code": "VES",
		"name": "Venezuelan Bolívar",
		"name_plural": "Venezuelan bolívars",
		"symbol": "Bs.S.",
		"symbol_native": "Bs.S.",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Vietnam",
	  "code": "VN",
	  "capital": "Hanoi",
	  "continent": "Asia",
	  "dial_code": "+84",
	  "currency": {
		"code": "VND",
		"name": "Vietnamese Dong",
		"name_plural": "Vietnamese dong",
		"symbol": "₫",
		"symbol_native": "₫",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Wallis and Futuna",
	  "code": "WF",
	  "capital": "Mata-Utu",
	  "continent": "Oceania",
	  "dial_code": "+681",
	  "currency": {
		"code": "XPF",
		"name": "CFP Franc",
		"name_plural": "CFP francs",
		"symbol": "CFPF",
		"symbol_native": "XPF",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Western Sahara",
	  "code": "EH",
	  "capital": "El Aaiún",
	  "continent": "Africa",
	  "dial_code": "+212",
	  "currency": {
		"code": "MAD",
		"name": "Moroccan Dirham",
		"name_plural": "Moroccan dirhams",
		"symbol": "MAD",
		"symbol_native": "د.م.‏",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Yemen",
	  "code": "YE",
	  "capital": "Sana'a",
	  "continent": "Asia",
	  "dial_code": "+967",
	  "currency": {
		"code": "YER",
		"name": "Yemeni Rial",
		"name_plural": "Yemeni rials",
		"symbol": "YR",
		"symbol_native": "ر.ي.‏",
		"decimal_digits": 0,
		"rounding": 0
	  }
	},
	{
	  "name": "Zambia",
	  "code": "ZM",
	  "capital": "Lusaka",
	  "continent": "Africa",
	  "dial_code": "+260",
	  "currency": {
		"code": "ZMW",
		"name": "Zambian Kwacha",
		"name_plural": "Zambian kwachas",
		"symbol": "ZK",
		"symbol_native": "ZK",
		"decimal_digits": 2,
		"rounding": 0
	  }
	},
	{
	  "name": "Zimbabwe",
	  "code": "ZW",
	  "capital": "Harare",
	  "continent": "Africa",
	  "dial_code": "+263",
	  "currency": {
		"code": "ZWL",
		"name": "Zimbabwean Dollar",
		"name_plural": "Zimbabwean dollars",
		"symbol": "ZWL$",
		"symbol_native": "$",
		"decimal_digits": 2,
		"rounding": 0
	  }
	}
  ]
  