import { SlideItem, ProjectSettings } from '../types';

export const SAMPLE_IMAGES = {
  nature: '/src/assets/images/sample_nature_alps_1793624953559.jpg',
  cyberpunk: '/src/assets/images/sample_cyberpunk_tokyo_1793624954887.jpg',
  heritage: '/src/assets/images/sample_desert_heritage_1793624956501.jpg',
  coffee: '/src/assets/images/sample_cozy_coffee_1793624955379.jpg',
};

export const INITIAL_SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    imageUrl: SAMPLE_IMAGES.heritage,
    name: 'مدينة البتراء الوردية',
    title: 'أعجوبة الصحراء الوردية',
    subtitle: 'شروق الشمس يعانق أعمدة الخزنة المحفورة في قلب الصخر',
    duration: 3.5,
    motion: 'pan_right',
    transition: 'crossfade',
    transitionDuration: 0.8,
    filter: 'golden_hour',
    textPosition: 'bottom',
    textAnimation: 'slide_up',
  },
  {
    id: 'slide-2',
    imageUrl: SAMPLE_IMAGES.nature,
    name: 'بحيرة جبال الألب',
    title: 'سكون الطبيعة العذراء',
    subtitle: 'انعكاس القمم الثلجية على مياه البحيرة الفيروزية الساحرة',
    duration: 3.5,
    motion: 'zoom_in',
    transition: 'zoom_through',
    transitionDuration: 0.8,
    filter: 'cinematic_warm',
    textPosition: 'bottom',
    textAnimation: 'fade',
  },
  {
    id: 'slide-3',
    imageUrl: SAMPLE_IMAGES.cyberpunk,
    name: 'أضواء طوكيو المستقبلية',
    title: 'نبض المدينة الساحرة',
    subtitle: 'انعكاسات أضواء النيون في أزقة الليل بعد هطول المطر',
    duration: 3.5,
    motion: 'dynamic_drift',
    transition: 'slide_left',
    transitionDuration: 0.8,
    filter: 'cyberpunk',
    textPosition: 'bottom',
    textAnimation: 'typewriter',
  },
  {
    id: 'slide-4',
    imageUrl: SAMPLE_IMAGES.coffee,
    name: 'لحظة هدوء مع القهوة',
    title: 'دفء البدايات الصباحية',
    subtitle: 'رائحة القهوة الطازجة ونسمات الصباح تملأ المكان راحة وسلاماً',
    duration: 3.5,
    motion: 'zoom_out',
    transition: 'fade_black',
    transitionDuration: 0.8,
    filter: 'vintage_film',
    textPosition: 'bottom',
    textAnimation: 'slide_up',
  },
];

export const INITIAL_PROJECT: ProjectSettings = {
  title: 'رحلة عبر الأفق والجمال',
  aspectRatio: '16:9',
  soundtrack: 'epic',
  soundtrackVolume: 0.65,
  voiceoverVolume: 0.9,
  resolution: '720p',
};

export const PRESET_THEMES = [
  {
    id: 'nature_alps',
    title: 'عجائب الطبيعة',
    desc: 'مشاهد جبلية وبحيرات عذبة مع موسيقى ملحمية',
    soundtrack: 'epic' as const,
    image: SAMPLE_IMAGES.nature,
  },
  {
    id: 'cyberpunk',
    title: 'أضواء المستقبل',
    desc: 'أجواء نيون عصرية وإيقاع إلكتروني مفعم بالحيوية',
    soundtrack: 'upbeat' as const,
    image: SAMPLE_IMAGES.cyberpunk,
  },
  {
    id: 'heritage',
    title: 'تاريخ وحضارة',
    desc: 'معالم أثرية أصيلة بألوان ذهبية دافئة',
    soundtrack: 'acoustic' as const,
    image: SAMPLE_IMAGES.heritage,
  },
  {
    id: 'coffee_cozy',
    title: 'لحظات هادئة',
    desc: 'أجواء مريحة مع قهوة الصباح وألحان لوفي ناعمة',
    soundtrack: 'lofi' as const,
    image: SAMPLE_IMAGES.coffee,
  },
];
