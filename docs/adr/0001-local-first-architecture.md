# Local-First Offline Architecture with Asynchronous Cloud Sync

Paddock environments frequently suffer from poor or non-existent mobile network connectivity. We decided to build the frontend as a local-first Progressive Web App (PWA) storing all data in client-side IndexedDB, with an asynchronous synchronisation queue that pushes updates to the Spring Boot REST API when connectivity is available. This guarantees immediate, non-blocking pit-lane data entry without network latency or timeout errors, at the cost of managing client-side sync queues and conflict resolution.
