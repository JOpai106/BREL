
export interface FilterMapping {
  oil: string | string[];
  oilAlt?: string;
  fuel: string | string[];
  fuelAlt?: string;
  air: string | string[];
  airAlt?: string;
  separator?: string | string[];
  belt?: string | string[];
  oilPrice?: number;
  fuelPrice?: number;
  airPrice?: number;
  separatorPrice?: number;
}

export const FILTER_MAPPINGS: Record<string, FilterMapping> = {
  "PERKINS 1103": {
    oil: ["LF716", "140517050"],
    fuel: ["FF5074", "26561117"],
    air: ["AH8925", "135326205"],
    oilPrice: 12500,
    fuelPrice: 10500,
    airPrice: 22500
  },
  "PERKINS 1104": {
    oil: ["LF716", "140517050"],
    fuel: ["FF5074", "26561117"],
    air: ["AH8925", "135326205"],
    oilPrice: 12500,
    fuelPrice: 10500,
    airPrice: 22500
  },
  "PERKINS 1106": {
    oil: ["LF16243", "996-452"],
    fuel: ["FF5300", "26560143"],
    air: ["AH1192", "901-048"],
    oilPrice: 18500,
    fuelPrice: 14500,
    airPrice: 38000
  },
  "PERKINS 1004": {
    oil: "LF716",
    fuel: "FF5074",
    air: "AH8925",
    oilPrice: 12500,
    fuelPrice: 10500,
    airPrice: 22500
  },
  "PERKINS 1006": {
    oil: "LF3349",
    fuel: "FF5052",
    air: "AH1192",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 38000
  },
  "PERKINS 403": {
    oil: ["LF16015", "140517050"],
    fuel: ["FF5167", "26561117"],
    air: "AH1100",
    oilPrice: 8500,
    fuelPrice: 7500,
    airPrice: 15000
  },
  "PERKINS 404": {
    oil: ["LF16015", "140517050"],
    fuel: ["FF5167", "26561117"],
    air: "AH1100",
    oilPrice: 8500,
    fuelPrice: 7500,
    airPrice: 15000
  },
  "CUMMINS 4BT": {
    oil: "LF3349",
    fuel: "FF5052",
    air: "AF1735K",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "CUMMINS 6BT": {
    oil: "LF3349",
    fuel: "FF5052",
    air: "AF1735K",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "CUMMINS 6CT": {
    oil: "LF3000",
    fuel: "FF5052",
    air: "AF25276",
    oilPrice: 25000,
    fuelPrice: 15000,
    airPrice: 45000
  },
  "SDMO T12": {
    oil: ["SN25964", "LF3925", "P502067", "SO6099"],
    fuel: ["P502458", "FT 23V", "330510018", "FF5218"],
    air: "CO65003",
    belt: "9.5X1000",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "SDMOT12": {
    oil: ["SN25964", "LF3925", "P502067", "SO6099"],
    fuel: ["P502458", "FT 23V", "330510018", "FF5218"],
    air: "CO65003",
    belt: "9.5X1000",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "SDMO T16": {
    oil: ["SO6099", "LF3925", "P502067"],
    fuel: ["FT23", "330510018", "FF5218"],
    air: ["AH1107", "CO85004"],
    belt: "9.5X1000",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 25000
  },
  "SDMOT16": {
    oil: ["SO6099", "LF3925", "P502067"],
    fuel: ["FT23", "330510018", "FF5218"],
    air: ["AH1107", "CO85004"],
    belt: "9.5X1000",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 25000
  },
  "SDMO T22": {
    oil: ["LF3776", "SO6117", "P502051"],
    fuel: ["FF5300", "330510038", "SN25964"],
    air: ["CO65003", "SAC065003"],
    belt: "AX38",
    oilPrice: 18000,
    fuelPrice: 14000,
    airPrice: 25000
  },
  "SDMOT22": {
    oil: ["LF3776", "SO6117", "P502051"],
    fuel: ["FF5300", "330510038", "SN25964"],
    air: ["CO65003", "SAC065003"],
    belt: "AX38",
    oilPrice: 18000,
    fuelPrice: 14000,
    airPrice: 25000
  },
  "SDMO J66": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMOJ66": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J88": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMOJ88": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J110": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMOJ110": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J110 KOHLER": {
    oil: ["LF16243", "RE59754", "LF3703"],
    fuel: ["SN70110", "P551424", "FS 19832"],
    air: ["C085004", "AH1107"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "ELCOS": {
    oil: ["P550008", "LF551A", "LF3313", "LF701", "P550425", "LF3321", "LF3654", "LF3675"],
    fuel: ["SN40730", "4461490", "P551429", "P550529", "FF5507", "FS19735"],
    air: ["P772578", "FAC643", "SA16416"],
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "PRAMAC": {
    oil: ["P550008", "LF551A", "LF3313", "LF701", "SO580"],
    fuel: ["SN40730", "4461490", "P551429"],
    air: "P772578",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "GL": {
    oil: ["P550008", "LF551A", "LF3313", "LF701"],
    fuel: ["SN40730", "4461490", "P551429"],
    air: "P772578",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO J22": {
    oil: ["P550020", "330560554"],
    fuel: "P551429",
    air: "CO85001",
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMOJ22": {
    oil: ["P550020", "330560554"],
    fuel: "P551429",
    air: "CO85001",
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO J33": {
    oil: ["P550020", "330560554"],
    fuel: "P551429",
    air: "CO85001",
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMOJ33": {
    oil: ["P550020", "330560554"],
    fuel: "P551429",
    air: "CO85001",
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO K33": {
    oil: ["330373630", "ED0021750010-S", "P550020", "330560554"],
    fuel: ["330370475", "ED0021753200S", "P551429"],
    air: ["CO85001", "CO85002"],
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMOK33": {
    oil: ["330373630", "ED0021750010-S", "P550020", "330560554"],
    fuel: ["330370475", "ED0021753200S", "P551429"],
    air: ["CO85001", "CO85002"],
    belt: "17*1275La B48",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO J44": {
    oil: ["LF16173", "RE19626", "P550758"],
    fuel: "P551429",
    air: ["CO85002", "AH1190"],
    oilPrice: 18000,
    fuelPrice: 12000,
    airPrice: 32000
  },
  "SDMOJ44": {
    oil: ["LF16173", "RE19626", "P550758"],
    fuel: "P551429",
    air: ["CO85002", "AH1190"],
    oilPrice: 18000,
    fuelPrice: 12000,
    airPrice: 32000
  },
  "SDMO T33": {
    oil: ["LF16173", "RE19626", "P550758", "P502458"],
    fuel: ["P551429", "SN25964"],
    air: "CO85002",
    oilPrice: 18000,
    fuelPrice: 12000,
    airPrice: 32000
  },
  "SDMOT33": {
    oil: ["LF16173", "RE19626", "P550758", "P502458"],
    fuel: ["P551429", "SN25964"],
    air: "CO85002",
    oilPrice: 18000,
    fuelPrice: 12000,
    airPrice: 32000
  },
  "SDMO D330": {
    oil: "P502464",
    fuel: "P558000",
    air: "330510066",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "CUMMINS 33": {
    oil: "SO10101",
    fuel: "P502913",
    air: "SA16690",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "KB 115": {
    oil: "LF17556",
    fuel: ["SN70242", "SN70299"],
    air: "AF25276",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "RENAULT T27": {
    oil: "P550227",
    fuel: "SN001",
    air: "CO65003",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "SDMO J165": {
    oil: ["LF16173", "RE19626", "P550758", "LF3703"],
    fuel: ["P551422", "SN70110"],
    air: "C105004",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J200": {
    oil: ["LF16173", "RE19626", "P550758", "SO10006"],
    fuel: ["P551422", "FS19833"],
    air: "C105004",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J220": {
    oil: ["LF16173", "RE19626", "P550758"],
    fuel: "P551422",
    air: "C105004",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "OLYMPIAN 175": {
    oil: "LF3883",
    fuel: "P552603",
    air: "AF25276",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "DEUTZ 97": {
    oil: "P553771",
    fuel: "P550588",
    air: "AF25276",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "GENELEC 16 KVA": {
    oil: "P554408",
    fuel: "SN25025",
    air: "CO65003",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "GENELEC 30 KVA": {
    oil: "P550935",
    fuel: ["ME006066", "SN25027", "FF253"],
    air: "P822768",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO K22": {
    oil: ["P552849", "SO142"],
    fuel: ["ED00217532005", "330370475", "SN70267"],
    air: ["C065001", "CO65003"],
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 25000
  },
  "SWT 143 KVA": {
    oil: "SO3349",
    fuel: ["P5530048", "P551329"],
    air: "AF25276",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO D440 KVA": {
    oil: ["SO6074", "P502464", "LF3716"],
    fuel: ["P558000", "FS1212", "330560507.0"],
    air: "SA14788",
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "FG WILSON P550 KVA": {
    oil: "P502477",
    fuel: ["P502479", "P502478"],
    air: "AF25276",
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "JCB 115 KVA": {
    oil: "SO11080",
    fuel: ["P551425", "SN70299"],
    air: "SA16229",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "ELCOS 350 KVA": {
    oil: ["P550425", "LF3321", "LF3654", "LF3675"],
    fuel: ["P550529", "FF5507", "FS19735"],
    air: ["FAC643", "SA16416"],
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "CUMMINS 660 KVA": {
    oil: ["P502464", "LF777"],
    fuel: ["SN1216", "FS1216"],
    air: "AF25276",
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "GENELEC 150 KVA": {
    oil: "P553004",
    fuel: "P550006",
    air: ["AF4059", "SA14009"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO D550 KVA": {
    oil: ["LF670", "P551670"],
    fuel: ["FS1212", "P558000"],
    air: "AF25276",
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "SDMO T44 KVA": {
    oil: ["P502458", "LF3828"],
    fuel: ["P502143", "FT5300"],
    air: ["CO85002", "AH1190"],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "CUMMINS 68 KVA": {
    oil: "LF16061",
    fuel: ["FF5053", "FF5524"],
    air: "AF25276",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "OLYMPIAN 30 KVA": {
    oil: "P554408",
    fuel: "SN30026",
    air: "P772578",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "FG WILSON P27 KVA": {
    oil: "P554408",
    fuel: "P551354",
    air: "CO65003",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "MARAPCO MP100 KVA": {
    oil: "P550006",
    fuel: "B7322",
    air: "AF25276",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO B44/B25": {
    oil: ["SO12048", "230181666"],
    fuel: ["SN35057", "230181641"],
    air: "CO85002",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "CUMMINS 132 KVA": {
    oil: "SO3349",
    fuel: ["P551329", "P553004"],
    air: "AF25276",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SWT 62 KVA": {
    oil: "SO3349",
    fuel: ["P551329", "P553004"],
    air: "AF25276",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "FG WILSON P22 KVA": {
    oil: ["SO128", "SO228"],
    fuel: "SN001",
    air: "CO65003",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "SDMO V375 KVA": {
    oil: ["SN70201", "SN926030"],
    fuel: ["SO3675", "SO11029"],
    air: "FAC643",
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 65000
  },
  "PRAMAC 65 KVA": {
    oil: ["P550008", "LF551A", "SO580"],
    fuel: "SN40730",
    air: "P772578",
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "SDMO D700 KVA": {
    oil: "P502464",
    fuel: ["P558000", "SN926010"],
    air: "SA14788",
    oilPrice: 45000,
    fuelPrice: 35000,
    airPrice: 85000
  },
  "FG WILSON 17 KVA": {
    oil: "SO6099",
    fuel: "P553004",
    air: "AF435KM",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "JUBILIS BROS 110 KVA": {
    oil: "P550008",
    fuel: ["SN001", "SN30017"],
    air: "SA16486",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "FG WILSON P110 KVA": {
    oil: "P550008",
    fuel: "SN30017",
    air: "AH8925",
    oilPrice: 22000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "JUBILIS BROS 600 KVA": {
    oil: "LF16250",
    fuel: ["P502479", "P502478"],
    air: "AF25276",
    oilPrice: 45000,
    fuelPrice: 35000,
    airPrice: 85000
  },
  "FOGO 20": {
    oil: ["SO6117", "LF3776"],
    fuel: "SN25964",
    air: "CO65003",
    oilPrice: 18000,
    fuelPrice: 14000,
    airPrice: 25000
  },
  "FG WILSON P110": {
    oil: "LF716",
    fuel: "FF5074",
    air: "AH8925",
    oilPrice: 12500,
    fuelPrice: 10500,
    airPrice: 22500
  },
  "FG WILSON P150": {
    oil: "LF3776",
    fuel: "FF5300",
    air: "AH1192",
    oilPrice: 18500,
    fuelPrice: 14500,
    airPrice: 38000
  },
  "SDMO X800 KVA": {
    oil: "LF16245",
    fuel: ["330510028", "330510016"],
    air: [],
    oilPrice: 45000,
    fuelPrice: 35000,
    airPrice: 0
  },
  "SDMO K16": {
    oil: "SO9000",
    fuel: "P553004",
    air: "C105003",
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 25000
  },
  "JUBALIS BROS 20 KVA": {
    oil: "SO128",
    fuel: "SN001",
    air: [],
    oilPrice: 12000,
    fuelPrice: 10000,
    airPrice: 0
  },
  "FG WILSON P40 KVA": {
    oil: "P550008",
    fuel: "P551354",
    air: [],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 0
  },
  "SDMO K J66-J110": {
    oil: ["P550779", "SO10044", "LF16243"],
    fuel: ["SN70110", "P551424"],
    air: ["CO85004", "AH1107", "SAC085004"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "GENELEC 60 KVA": {
    oil: "P554403",
    fuel: "P553004",
    air: [],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 0
  },
  "CATPILAR 200 ET 250": {
    oil: ["462-1171", "P550920", "LF691"],
    fuel: ["BF825", "SN001", "FF167", "435-6493"],
    air: [],
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 0
  },
  "ELCOS 20 YANMAR": {
    oil: ["SO6117", "LF3776", "P502051"],
    fuel: ["SN25031", "BF7907", "FF165", "FF166"],
    air: ["P822768", "AF25553"],
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "SDMO K700": {
    oil: ["P502464", "LF3716", "SO6074"],
    fuel: ["P558000", "FS1212", "330560507.0"],
    air: ["AF25708MP613333", "SA16355"],
    oilPrice: 45000,
    fuelPrice: 35000,
    airPrice: 85000
  },
  "SDMO K110": {
    oil: ["LF16243", "330510062"],
    fuel: ["SN70110", "FS19531"],
    air: ["AH1107", "CO85004"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO 110": {
    oil: ["LF16243", "330510062"],
    fuel: ["SN70110", "P551424"],
    air: [],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 0
  },
  "PERKINS 33 à 60": {
    oil: ["P550008", "LF701"],
    fuel: ["SN40730", "SN30026"],
    air: ["P822768", "AF25436", "SA16059"],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 35000
  },
  "GETRION 45": {
    oil: ["P550008", "LF701"],
    fuel: "SN30026",
    air: [],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 0
  },
  "ELCOS 40 KVA": {
    oil: ["LF3776", "SO6117"],
    fuel: "FT7219",
    air: [],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 0
  },
  "SDMO K110 KVA": {
    oil: "P551423",
    fuel: "LF16243",
    air: [],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 0
  },
  "OLYMPIAN 50 KVA": {
    oil: ["P550008", "LF701"],
    fuel: "SN30026",
    air: [],
    oilPrice: 18000,
    fuelPrice: 15000,
    airPrice: 0
  },
  "ELCOS - 20-30 YANMAR": {
    oil: ["LF3776", "SO6117"],
    fuel: ["SN25031", "FF5485", "FF165"],
    air: ["SA17217", "AF27867"],
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 28000
  },
  "ELCOS 120 KVA": {
    oil: [],
    fuel: ["P550520", "LF16015"],
    air: [],
    oilPrice: 0,
    fuelPrice: 22000,
    airPrice: 0
  },
  "GE J276": {
    oil: "P558329",
    fuel: "FF5029",
    air: [],
    belt: "R135590",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 0
  },
  "SDMO K66": {
    oil: ["LF716", "SO142", "P552849"],
    fuel: ["ED0021753200S", "SN70267", "330370475"],
    air: ["CO85002", "AH1190", "SAC085002"],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 45000
  },
  "SDMO J276": {
    oil: ["LF3567", "SO3317", "P558329"],
    fuel: ["FF5045", "P556745", "SN5045"],
    air: [],
    belt: "R135590",
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 0
  },
  "CUMMINS 630": {
    oil: ["LF3716", "LF777", "P502464"],
    fuel: ["SN1216", "FS1216"],
    air: [],
    oilPrice: 35000,
    fuelPrice: 25000,
    airPrice: 0
  },
  "SDMO X1000": {
    oil: ["230510001", "SO526"],
    fuel: ["230510003", "330510016"],
    air: [],
    oilPrice: 45000,
    fuelPrice: 35000,
    airPrice: 0
  },
  "SDMO K27": {
    oil: "LF3624",
    fuel: ["ED0021753200S", "330370475", "SN70267"],
    air: "CO65003",
    oilPrice: 15000,
    fuelPrice: 12000,
    airPrice: 25000
  },
  "PERKINS J165": {
    oil: ["2656A111", "P550008"],
    fuel: ["26560143", "SN70110"],
    air: [],
    oilPrice: 25000,
    fuelPrice: 18000,
    airPrice: 0
  }
};

export const ALL_REFS = Array.from(new Set([
  ...Object.values(FILTER_MAPPINGS).flatMap(m => {
    const refs = [];
    if (Array.isArray(m.oil)) refs.push(...m.oil); else if (m.oil) refs.push(m.oil);
    if (m.oilAlt) refs.push(m.oilAlt);
    if (Array.isArray(m.fuel)) refs.push(...m.fuel); else if (m.fuel) refs.push(m.fuel);
    if (m.fuelAlt) refs.push(m.fuelAlt);
    if (Array.isArray(m.air)) refs.push(...m.air); else if (m.air) refs.push(m.air);
    if (m.airAlt) refs.push(m.airAlt);
    if (Array.isArray(m.belt)) refs.push(...m.belt); else if (m.belt) refs.push(m.belt);
    return refs;
  })
]));
