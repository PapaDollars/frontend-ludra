// Source unique pour toutes les données de propriété utilisées dans les formulaires et filtres

export const LOCATIONS = [
  { value: 'maroua',     label: 'locations.maroua' },
  { value: 'garoua',     label: 'locations.garoua' },
  { value: 'ngaoundere', label: 'locations.ngaoundere' },
  { value: 'bertoua',    label: 'locations.bertoua' },
  { value: 'yaounde',    label: 'locations.yaounde' },
  { value: 'douala',     label: 'locations.douala' },
  { value: 'bafoussam',  label: 'locations.bafoussam' },
  { value: 'ebolowa',    label: 'locations.ebolowa' },
  { value: 'buea',       label: 'locations.buea' },
] as const;

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'property_types.apartment' },
  { value: 'studio',    label: 'property_types.studio' },
  { value: 'house',     label: 'property_types.house' },
  { value: 'room',      label: 'property_types.room' },
] as const;

export const AMENITIES = [
  { value: 'wifi',      label: 'amenities.wifi' },
  { value: 'parking',   label: 'amenities.parking' },
  { value: 'security',  label: 'amenities.security' },
  { value: 'garden',    label: 'amenities.garden' },
  { value: 'gym',       label: 'amenities.gym' },
  { value: 'pool',      label: 'amenities.pool' },
  { value: 'ac',        label: 'amenities.ac' },
  { value: 'furnished', label: 'amenities.furnished' },
  { value: 'balcony',   label: 'amenities.balcony' },
  { value: 'elevator',  label: 'amenities.elevator' },
] as const;
