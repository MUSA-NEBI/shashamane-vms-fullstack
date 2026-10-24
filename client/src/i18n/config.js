import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  'en-US': {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        services: 'Services',
        about: 'About',
        signIn: 'Sign In',
        register: 'Register',
        dashboard: 'Dashboard',
        language: 'Language'
      },
      
      // Hero Section
      hero: {
        badge: 'Shashamane, Ethiopia',
        title: 'Your Journey,',
        titleAccent: 'Managed Perfectly',
        subtitle: 'Book intercity buses from Shashamane. Choose your seat, pay securely, and travel with your digital ticket — all in one platform.',
        getStarted: 'Get Started Free',
        searchTrips: 'Search Trips'
      },
      
      // Statistics
      stats: {
        vehicles: 'Vehicles',
        passengers: 'Daily Passengers',
        routes: 'Routes',
        onTime: 'On-time Rate'
      },
      
      // Search Section
      search: {
        title: 'Search Available Trips',
        subtitle: 'Find buses from your city to your destination',
        from: 'From',
        to: 'To',
        date: 'Date',
        passengers: 'Passengers',
        search: 'Search',
        fromPlaceholder: 'e.g. Shashamane',
        toPlaceholder: 'e.g. Addis Ababa'
      },
      
      // Services
      services: {
        title: 'Everything You Need',
        subtitle: 'A complete transportation management solution',
        digitalTickets: 'Digital Tickets',
        digitalTicketsDesc: 'Book your seat and receive a QR-coded ticket instantly. No printing needed.',
        securePayments: 'Secure Payments',
        securePaymentsDesc: 'Safe, traceable payment records. Cash, card, or mobile money accepted.',
        liveSchedules: 'Live Schedules',
        liveSchedulesDesc: 'Real-time schedule updates. Know exactly when your bus departs.',
        seatSelection: 'Seat Selection',
        seatSelectionDesc: 'Choose your preferred seat from an interactive seat map.',
        fullReporting: 'Full Reporting',
        fullReportingDesc: 'Admins get complete dashboards with revenue, bookings, and fleet data.',
        notifications: 'Notifications',
        notificationsDesc: 'Get notified for booking confirmations, cancellations, and more.'
      },
      
      // About Section
      about: {
        title: 'Built for Shashamane',
        intro: 'The Shashamane Vehicle Management System is a purpose-built platform for managing intercity bus transportation in Shashamane, Ethiopia. It connects passengers, drivers, dispatchers, and administrators in one unified system.',
        feature1: 'Real-time fleet and schedule management',
        feature2: 'Multi-role access: Admin, Dispatcher, Driver, Passenger',
        feature3: 'Secure digital bookings and QR tickets',
        feature4: 'Full payment tracking in Ethiopian Birr (ETB)',
        createAccount: 'Create Account'
      },
      
      // Footer
      footer: {
        tagline: 'Shashamane Vehicle Management System — Shashamane, Ethiopia',
        copyright: 'SVMS. All rights reserved.',
        quickLinks: 'Quick Links',
        contact: 'Contact Information'
      },
      
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        required: 'Required'
      }
    }
  },
  
  'am-ET': {
    translation: {
      // Navigation - አማርኛ
      nav: {
        home: 'መነሻ',
        services: 'አገልግሎቶች',
        about: 'ስለእኛ',
        signIn: 'ግባ',
        register: 'ተመዝገብ',
        dashboard: 'ዳሽቦርድ',
        language: 'ቋንቋ'
      },
      
      // Hero Section
      hero: {
        badge: 'ሻሸመኔ፣ ኢትዮጵያ',
        title: 'የእርስዎ ጉዞ፣',
        titleAccent: 'በትክክል የተመራ',
        subtitle: 'ከሻሸመኔ የከተሞች አውቶቡሶችን ይምረጡ። መቀመጫዎን ይምረጡ፣ በአስተማማኝ ሁኔታ ይክፈሉ፣ እና በዲጂታል ቲኬትዎ ይጓዙ — ሁሉም በአንድ መድረክ ላይ።',
        getStarted: 'በነጻ ይጀምሩ',
        searchTrips: 'ጉዞዎችን ፈልግ'
      },
      
      // Statistics
      stats: {
        vehicles: 'ተሽከርካሪዎች',
        passengers: 'ዕለታዊ ተሳፋሪዎች',
        routes: 'መንገዶች',
        onTime: 'በሰዓቱ መጠን'
      },
      
      // Search Section
      search: {
        title: 'ሊገኙ የሚችሉ ጉዞዎችን ይፈልጉ',
        subtitle: 'ከከተማዎ ወደ መድረሻዎ አውቶቡሶችን ያግኙ',
        from: 'ከ',
        to: 'ወደ',
        date: 'ቀን',
        passengers: 'ተሳፋሪዎች',
        search: 'ፈልግ',
        fromPlaceholder: 'ለምሳሌ ሻሸመኔ',
        toPlaceholder: 'ለምሳሌ አዲስ አበባ'
      },
      
      // Services
      services: {
        title: 'የሚያስፈልጉት ሁሉ',
        subtitle: 'ሙሉ የመጓጓዣ አስተዳደር መፍትሄ',
        digitalTickets: 'ዲጂታል ቲኬቶች',
        digitalTicketsDesc: 'መቀመጫዎን ያስይዙ እና QR-ኮድ ቲኬትዎን በፍጥነት ይቀበሉ። ማተም አያስፈልግም።',
        securePayments: 'ደህንነቱ የተጠበቀ ክፍያዎች',
        securePaymentsDesc: 'ደህንነታቸው የተጠበቀ፣ መከታተል የሚቻሉ የክፍያ መዛግብት። ጥሬ ገንዘብ፣ ካርድ ወይም ሞባይል ገንዘብ ይቀበላል።',
        liveSchedules: 'በቀጥታ መርሃግብሮች',
        liveSchedulesDesc: 'በእውነተኛ ጊዜ የመርሃግብር ዝማኔዎች። አውቶቡስዎ መቼ እንደሚነሳ በትክክል ያውቁ።',
        seatSelection: 'መቀመጫ ምርጫ',
        seatSelectionDesc: 'ከተለዋዋጭ የመቀመጫ ካርታ የሚመርጡትን መቀመጫ ይምረጡ።',
        fullReporting: 'ሙሉ ሪፖርት',
        fullReportingDesc: 'አስተዳዳሪዎች የገቢ፣ የማስያዣዎች እና የተሽከርካሪዎች መረጃ ያላቸው ሙሉ ዳሽቦርዶች ያገኛሉ።',
        notifications: 'ማሳወቂያዎች',
        notificationsDesc: 'ስለ ማስያዣ ማረጋገጫዎች፣ ስረዛዎች እና ሌሎችም ማሳወቂያ ይቀበሉ።'
      },
      
      // About Section
      about: {
        title: 'ለሻሸመኔ የተገነባ',
        intro: 'የሻሸመኔ ተሽከርካሪ አስተዳደር ስርዓት በሻሸመኔ፣ ኢትዮጵያ ውስጥ የከተሞች መካከል የአውቶቡስ መጓጓዣን ለማስተዳደር በዓላማ የተገነባ መድረክ ነው። ተሳፋሪዎችን፣ ሹፌሮችን፣ አዘጋጆችን እና አስተዳዳሪዎችን በአንድ ተቀናጅ ስርዓት ያገናኛል።',
        feature1: 'በእውነተኛ ጊዜ የተሽከርካሪዎች እና የመርሃግብር አስተዳደር',
        feature2: 'ብዙ-ሚና መዳረሻ፡ አስተዳዳሪ፣ አዘጋጅ፣ ሹፌር፣ ተሳፋሪ',
        feature3: 'ደህንነታቸው የተጠበቀ ዲጂታል ማስያዣዎች እና QR ቲኬቶች',
        feature4: 'ሙሉ የክፍያ መከታተያ በኢትዮጵያ ብር (ብር)',
        createAccount: 'መለያ ፍጠር'
      },
      
      // Footer
      footer: {
        tagline: 'የሻሸመኔ ተሽከርካሪ አስተዳደር ስርዓት — ሻሸመኔ፣ ኢትዮጵያ',
        copyright: 'SVMS. ሁሉም መብቶች የተጠበቁ ናቸው።',
        quickLinks: 'ፈጣን አገናኞች',
        contact: 'የእውቂያ መረጃ'
      },
      
      // Common
      common: {
        loading: 'በመጫን ላይ...',
        error: 'ስህተት ተፈጥሯል',
        success: 'ተሳክቷል',
        cancel: 'ሰርዝ',
        save: 'አስቀምጥ',
        delete: 'ሰርዝ',
        edit: 'አርትዕ',
        create: 'ፍጠር',
        update: 'አዘምን',
        required: 'ያስፈልጋል'
      }
    }
  },
  
  'om-ET': {
    translation: {
      // Navigation - Afaan Oromoo
      nav: {
        home: 'Galma',
        services: 'Tajaajilawwan',
        about: 'Waa\'ee Keenya',
        signIn: 'Seeni',
        register: 'Galmaa\'i',
        dashboard: 'Gabatee',
        language: 'Afaan'
      },
      
      // Hero Section
      hero: {
        badge: 'Shashamannee, Itoophiyaa',
        title: 'Imala Kee,',
        titleAccent: 'Haala Gaarii Bulchamaa',
        subtitle: 'Otobusii magaalaa gidduutti Shashamannee irraa buufadhu. Teessoo kee filadhu, haala nagaan kaffali, fi tiikeetii dijitaalaa keetiin imali — hunduu waltajjii tokko keessatti.',
        getStarted: 'Bilisaan Jalqabi',
        searchTrips: 'Imalaawwan Barbaadi'
      },
      
      // Statistics
      stats: {
        vehicles: 'Konkolaatota',
        passengers: 'Imaltota Guyyaa',
        routes: 'Karaalee',
        onTime: 'Saffisa Yeroo'
      },
      
      // Search Section
      search: {
        title: 'Imalaawwan Jiran Barbaadi',
        subtitle: 'Otobusii magaalaa kee irraa gara bakka deemanuu barbaaddu argadhu',
        from: 'Irraa',
        to: 'Gara',
        date: 'Guyyaa',
        passengers: 'Imaltota',
        search: 'Barbaadi',
        fromPlaceholder: 'fakkeenyaaf Shashamannee',
        toPlaceholder: 'fakkeenyaaf Finfinnee'
      },
      
      // Services
      services: {
        title: 'Waan Si Barbaachisu Hunda',
        subtitle: 'Furmaata bulchiinsa geejjibaa guutuu',
        digitalTickets: 'Tiikeetii Dijitaalaa',
        digitalTicketsDesc: 'Teessoo kee buufadhu fi tiikeetii QR-koodii qabu battalumatti argadhu. Maxxansuu hin barbaachisu.',
        securePayments: 'Kaffaltii Nageenya',
        securePaymentsDesc: 'Galoo kaffaltii nageenya qabuu fi hordofamuu danda\'u. Qarshii, kaardii ykn maallaqa mobaayilaa fudhata.',
        liveSchedules: 'Sagantaalee Kallattiin',
        liveSchedulesDesc: 'Fooyya\'iinsa sagantaa yeroo dhugaa. Otobusiin kee yoom akka ka\'u sirriitti beeki.',
        seatSelection: 'Filannoo Teessoo',
        seatSelectionDesc: 'Kaartaa teessoo wal-qunnamtii irraa teessoo filatte filadhu.',
        fullReporting: 'Gabaasa Guutuu',
        fullReportingDesc: 'Bulchitoonni gabateewwan guutuu galii, buufata fi deetaa konkolaatotaa argatu.',
        notifications: 'Beeksisawwan',
        notificationsDesc: 'Mirkaneessaa buufataa, haquu fi kanneen biroof beeksisa argadhu.'
      },
      
      // About Section
      about: {
        title: 'Shashamannee\'f Ijaarame',
        intro: 'Sirni Bulchiinsa Konkolaataa Shashamannee waltajjii kaayyoo addaatiin geejjiba otobusii magaalaa gidduutti Shashamannee, Itoophiyaa keessatti bulchuuf ijaarame dha. Imaltota, konkolaatchitoota, ergamoota fi bulchitoota sirna tokkummaa keessatti walitti qaba.',
        feature1: 'Bulchiinsa konkolaatotaa fi sagantaa yeroo dhugaa',
        feature2: 'Ittiin-aansaa gahee hedduu: Bulchaa, Ergamaa, Konkolaataa, Imaltuu',
        feature3: 'Buufata dijitaalaa nageenya qabuu fi tiikeetii QR',
        feature4: 'Hordoffii kaffaltii guutuu qarshii Itoophiyaa (ETB) tiin',
        createAccount: 'Herrega Uumi'
      },
      
      // Footer
      footer: {
        tagline: 'Sirni Bulchiinsa Konkolaataa Shashamannee — Shashamannee, Itoophiyaa',
        copyright: 'SVMS. Mirgi hunduu eegameera.',
        quickLinks: 'Geessituu Saffisaa',
        contact: 'Odeeffannoo Quunnamtii'
      },
      
      // Common
      common: {
        loading: 'Fe\'aa jira...',
        error: 'Dogoggorri uumameera',
        success: 'Milkaa\'ine',
        cancel: 'Haqii',
        save: 'Olkaa\'i',
        delete: 'Haqii',
        edit: 'Gulaali',
        create: 'Uumi',
        update: 'Haaromsi',
        required: 'Barbaachisaa'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'am-ET', 'om-ET'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
