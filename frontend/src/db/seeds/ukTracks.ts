export interface TrackSeedDefinition {
  name: string
  country: string
  layouts: {
    name: string
    lengthMetres?: number
  }[]
}

export const UK_TRACK_SEEDS: TrackSeedDefinition[] = [
  {
    name: 'Anglesey Circuit',
    country: 'United Kingdom',
    layouts: [
      { name: 'International', lengthMetres: 3380 },
      { name: 'Coastal', lengthMetres: 2494 },
      { name: 'National', lengthMetres: 1931 },
      { name: 'Club', lengthMetres: 1287 },
    ],
  },
  {
    name: 'Bedford Autodrome',
    country: 'United Kingdom',
    layouts: [
      { name: 'GT', lengthMetres: 6116 },
      { name: 'SEN', lengthMetres: 3710 },
    ],
  },
  {
    name: 'Brands Hatch',
    country: 'United Kingdom',
    layouts: [
      { name: 'Grand Prix', lengthMetres: 3916 },
      { name: 'Indy', lengthMetres: 1944 },
    ],
  },
  {
    name: 'Cadwell Park',
    country: 'United Kingdom',
    layouts: [
      { name: 'Full Circuit', lengthMetres: 3502 },
      { name: 'Club', lengthMetres: 2375 },
      { name: 'Woodlands', lengthMetres: 1365 },
    ],
  },
  {
    name: 'Castle Combe',
    country: 'United Kingdom',
    layouts: [
      { name: 'Full Circuit', lengthMetres: 2977 },
    ],
  },
  {
    name: 'Croft',
    country: 'United Kingdom',
    layouts: [
      { name: 'Full Circuit', lengthMetres: 3423 },
      { name: 'Club Circuit A', lengthMetres: 1977 },
      { name: 'Club Circuit B', lengthMetres: 1529 },
    ],
  },
  {
    name: 'Donington Park',
    country: 'United Kingdom',
    layouts: [
      { name: 'Grand Prix', lengthMetres: 4020 },
      { name: 'National', lengthMetres: 3149 },
    ],
  },
  {
    name: 'Goodwood',
    country: 'United Kingdom',
    layouts: [
      { name: 'Full Circuit', lengthMetres: 3862 },
    ],
  },
  {
    name: 'Knockhill',
    country: 'United Kingdom',
    layouts: [
      { name: 'International', lengthMetres: 2092 },
      { name: 'National', lengthMetres: 1609 },
    ],
  },
  {
    name: 'Oulton Park',
    country: 'United Kingdom',
    layouts: [
      { name: 'International', lengthMetres: 4333 },
      { name: 'Island', lengthMetres: 3637 },
      { name: 'Fosters', lengthMetres: 2662 },
    ],
  },
  {
    name: 'Silverstone',
    country: 'United Kingdom',
    layouts: [
      { name: 'Grand Prix', lengthMetres: 5890 },
      { name: 'National', lengthMetres: 2639 },
      { name: 'International', lengthMetres: 2979 },
    ],
  },
  {
    name: 'Snetterton',
    country: 'United Kingdom',
    layouts: [
      { name: '300', lengthMetres: 4779 },
      { name: '200', lengthMetres: 3219 },
    ],
  },
  {
    name: 'Thruxton',
    country: 'United Kingdom',
    layouts: [
      { name: 'Full Circuit', lengthMetres: 3791 },
    ],
  },
]
