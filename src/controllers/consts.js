module.exports = {
    alertTypes: {
        missing: 9,
        power: 17,
        unhealthy: 3
    },

    alertPriorityMappings: {
        4225: "Low",
        4226: "Medium",
        4227: "High"
    },

    alertTypesMappings: {
        "-1": "Manual",
        "1": "Battery",
        "2": "Cooler Connectivity",
        "3": "Cooler Malfunction",
        "4": "Device Accumulated Movement",
        "5": "Door Duration",
        "6": "Door Open Max",
        "7": "Door Open Min",
        "8": "Environment Temperature",
        "9": "GPS Displacement",
        "10": "Temperature Alert",
        "11": "Hub Accumulated Movement",
        "12": "Missing Data",
        "13": "Movement Duration",
        "14": "No Data",
        "15": "No Door Data",
        "16": "Planogram Alert",
        "17": "Power",
        "18": "Purity Alert",
        "19": "Stock Alert",
        "20": "Movement Count",
        "21": "Stock Alert Product Wise",
        "22": "Stock Alert Shelf Wise",
        "23": "Light Alert",
        "24": "Environment Light",
        "25": "Door Percentage",
        "26": "Outlet SOVI",
        "27": "VH Core Battery",
        "28": "Opportunity Out Of Stock",
        "29": "Opportunity Low Stock",
        "30": "Product Position Alert",
        "31": "Smart Reward Issue",
        "32":"Door Open Min And Sales",
        "33":"Light Off Hours And Sales",
        "34":"Temperature And Sales",
        "35":"High Door Utilization Low Sales",
        "36":"Low Door Utilization High Sales",
        "37":"System Door Duration",
        "38":"Out of Stock SKU Based",
        "39":"Planogram Out of Stock",
        "40":"Hub Movement Duration"
    },
    BeverageType: {
        Sparkling: 5241,
        NonCarbonated: 5242
    },
    SmartDeviceType: {
        Wellington: "28"
    },
    Threshold: {
        Light: 10,
        Temperature: 7,
        LowUtilization: 10,
        MinTempValue: 1,
        MaxTempValue: 12,
        STFirstGenNoLight: 19,
        STFirstGenLowBrightness: 30,
        STFirstGenMediumBrightness: 450,
        SVFirstGenNoLight: 3,
        SVFirstGenLowBrightness: 5,
        SVFirstGenMediumBrightness: 23,
        STSecondGenNoLight: 10,
        STSecondGenLowBrightness: 100,
        STSecondGenMediumBrightness: 160,
        LightMin : 8,
        LightMax: 34,
        OOSSKU : 0,
        PowerOff : 0,
        HealthIntervals : .10

    }
};