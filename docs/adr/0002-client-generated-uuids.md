# Client-Generated UUID Primary Keys for Local-First Entities

Because the Vue frontend must create records (Vehicles, Track Days, Sessions, Tyre Readings) while completely offline in the paddock, we decided to use client-generated UUIDs (UUIDv7 or UUIDv4) as primary keys across both client-side IndexedDB and backend PostgreSQL tables. This avoids temporary ID remapping and allows relational graphs created offline to persist directly into the database upon synchronization without foreign key rewriting.
