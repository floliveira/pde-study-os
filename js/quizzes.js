window.PDE_QUIZZES = {
  design: [
    {
      q: "EU customer profiles must be stored and queried only in the EU. You are creating the BigQuery dataset today. What do you do?",
      choices: [
        "Create the dataset in a US multi-region and copy EU rows to a view.",
        "Create the dataset in the eu multi-region or a specific EU region.",
        "Create it anywhere and attach a Cloud Armor policy.",
        "Use CMEK. Location no longer matters if keys stay in the EU."
      ],
      answer: 1,
      why: "BigQuery dataset location is chosen at creation and cannot be changed in place. Residency is a location decision, not an encryption decision."
    },
    {
      q: "Analysts need SQL on a table that contains national IDs. Only the compliance group may see the raw IDs. Best design?",
      choices: [
        "Give analysts roles/owner and ask them to be careful.",
        "Split the column into a second project and hope nobody joins it.",
        "Policy tags + column-level IAM, and DLP de-identification for lower environments.",
        "Put the table in Firestore because documents hide fields."
      ],
      answer: 2,
      why: "Column-level security via policy tags is the BigQuery-native control. DLP handles discovery and masking, especially for non-prod copies."
    },
    {
      q: "A regulator requires that your company can revoke Google’s ability to decrypt warehouse data within minutes. What key model?",
      choices: [
        "Google-managed encryption keys",
        "Customer-managed keys in Cloud KMS (CMEK)",
        "Store the passphrase in a BigQuery label",
        "Cloud SQL SSL only"
      ],
      answer: 1,
      why: "CMEK lets you disable or destroy the KMS key and render ciphertext unreadable. Default Google-managed keys do not give you that switch."
    },
    {
      q: "Stolen service-account keys should not be able to copy a prod BigQuery dataset to a personal project on the public internet. Which control is aimed at that threat?",
      choices: [
        "Looker Studio row limits",
        "VPC Service Controls perimeter",
        "Dataproc preemptible VMs",
        "BI Engine reservation"
      ],
      answer: 1,
      why: "VPC-SC is an exfiltration perimeter around Google APIs. IAM alone is not enough once a key has leaked."
    },
    {
      q: "You need continuous replication of an on-prem Oracle OLTP system into BigQuery with low source impact. First tool to evaluate?",
      choices: [
        "Transfer Appliance every Friday",
        "gsutil rsync of CSV dumps",
        "Datastream CDC",
        "Memorystore"
      ],
      answer: 2,
      why: "Datastream is the CDC path into BigQuery/GCS. Appliance is for bulk offline. gsutil dumps are batch and heavy on the source."
    },
    {
      q: "Prod and sandbox data engineering should not share IAM blast radius. What is the default Google-shaped answer?",
      choices: [
        "One project, two datasets, same service account",
        "Separate projects (and usually folders) for prod vs non-prod",
        "Separate Bigtable row-key prefixes",
        "A single Composer DAG with a 'prod' boolean"
      ],
      answer: 1,
      why: "Projects are the IAM, billing, and quota isolation unit. Datasets alone are too weak for prod isolation."
    },
    {
      q: "Which statement about BigQuery ACID vs Cloud SQL is exam-correct?",
      choices: [
        "BigQuery is the right system of record for inventory reservations at 5k writes/sec with conflicts.",
        "Cloud SQL / Spanner / AlloyDB are the transactional stores; BigQuery is analytical.",
        "BigQuery multi-statement transactions replace Spanner for global payments.",
        "Firestore is required whenever ACID is mentioned."
      ],
      answer: 1,
      why: "Do not park OLTP conflict workloads on the warehouse. BQ transactions exist but they are not why you buy BigQuery."
    },
    {
      q: "Petabytes sit in a colocation facility. The cutover window is 10 days and the WAN cannot finish the copy. What mover fits?",
      choices: [
        "Pub/Sub",
        "Transfer Appliance",
        "Firestore export",
        "Cloud Scheduler"
      ],
      answer: 1,
      why: "Physical ingest when the network is the blocker. Pub/Sub is an event bus, not a truck."
    }
  ],
  ingest: [
    {
      q: "Clickstream must be aggregated by 1-minute event-time windows and written exactly once to BigQuery. Core processing service?",
      choices: [
        "Cloud Functions reading Pub/Sub one event at a time",
        "Dataflow (Apache Beam) with event-time windows",
        "A cron on Compute Engine running grep",
        "Memorystore pub/sub clone"
      ],
      answer: 1,
      why: "Windowing + event time + exactly-once sinks is Dataflow’s home turf. Functions do not give you Beam watermarks."
    },
    {
      q: "The company has 200 production Spark jobs on YARN and two years to stop running Hadoop. Fastest honest landing on Google Cloud?",
      choices: [
        "Rewrite all jobs in Beam this quarter",
        "Dataproc and keep Spark, then modernize incrementally",
        "Upload the YARN RM into App Engine",
        "Put parquet in Firestore"
      ],
      answer: 1,
      why: "Dataproc exists so Spark/Hive estates can move first and refactor later."
    },
    {
      q: "A Dataflow job’s watermark has passed 10:00. An event with event-time 09:50 arrives at 10:07. What is that event?",
      choices: [
        "A watermark",
        "On-time data in the current pane",
        "Late data, handled by allowed lateness / late panes / DLQ",
        "Exactly-once proof"
      ],
      answer: 2,
      why: "Late = event time behind the watermark. You configure allowed lateness; you do not pretend it was on time."
    },
    {
      q: "Which window type groups activity that pauses for N minutes of inactivity?",
      choices: ["Fixed", "Sliding", "Session", "Partition"],
      answer: 2,
      why: "Session windows close after a gap. Fixed are equal buckets. Sliding overlap. Partition is storage, not Beam."
    },
    {
      q: "SQL transformations, tests, and dev/prod environments all inside BigQuery. Best-fit tool?",
      choices: ["Dataform", "Dataproc", "Bigtable", "Transfer Appliance"],
      answer: 0,
      why: "Dataform is SQL-first ELT with assertions and environments. Dataproc is Spark."
    },
    {
      q: "You need a visual ETL tool for a team that will not write Beam, including some CDC. Which product is in the guide for that?",
      choices: ["Looker Studio", "Cloud Data Fusion", "Identity Platform", "Cloud CDN"],
      answer: 1,
      why: "Data Fusion is the managed visual ETL/CDC option named in the exam guide."
    },
    {
      q: "Many dependent jobs, retries, sensors, and a team that already writes Airflow. Orchestrator?",
      choices: ["Cloud Composer", "Pub/Sub only", "Cloud Armor", "App Engine cron only"],
      answer: 0,
      why: "Composer is managed Airflow. Workflows is the lighter alternative when you do not need Airflow."
    },
    {
      q: "Pub/Sub delivery guarantee you should design consumers around?",
      choices: [
        "Exactly-once by default to every subscriber",
        "At-least-once; consumers must be idempotent",
        "At-most-once with no retries",
        "Synchronous ACID across topics"
      ],
      answer: 1,
      why: "Pub/Sub is at-least-once. Dedup or idempotent sinks live in Dataflow/BigQuery MERGE, not in wishful thinking."
    },
    {
      q: "A simple two-step flow: call Dataflow, then notify a Cloud Function. No Airflow estate. Lean orchestrator?",
      choices: ["Cloud Composer on a 3-node GKE-sized setup", "Workflows", "Spanner change streams only", "Cloud SQL HA"],
      answer: 1,
      why: "Workflows is the lightweight Google-API orchestrator. Composer is overkill for two steps."
    }
  ],
  store: [
    {
      q: "IoT fleet writes 100k points/sec. Dashboards need millisecond latest-value reads by device. Store?",
      choices: ["BigQuery", "Bigtable", "Cloud Storage Archive", "Looker"],
      answer: 1,
      why: "Huge write QPS + millisecond point reads = Bigtable. Design the row key as device#reversed-timestamp or similar — never timestamp-first."
    },
    {
      q: "A 40 TB click history must support arbitrary SQL from analysts and Looker. Store?",
      choices: ["Bigtable", "Memorystore", "BigQuery", "Filestore"],
      answer: 2,
      why: "Ad-hoc SQL at warehouse scale is BigQuery. Bigtable is not your analyst workbench."
    },
    {
      q: "Global payments require external consistency and multi-region transactions. Store?",
      choices: ["Cloud SQL HA in one region", "Spanner", "GCS Standard", "BigQuery streaming"],
      answer: 1,
      why: "Spanner is the global relational product. Cloud SQL HA is regional."
    },
    {
      q: "Lift a 200 GB PostgreSQL app with modest QPS and no global requirement.",
      choices: ["Spanner (always)", "Cloud SQL for PostgreSQL", "Bigtable", "Pub/Sub"],
      answer: 1,
      why: "Cloud SQL is the lift-and-shift regional relational default. Spanner would work and overpay."
    },
    {
      q: "Same Postgres compatibility but heavier analytical queries on operational data. Which extra candidate does the guide name?",
      choices: ["AlloyDB", "Cloud CDN", "Identity-Aware Proxy", "Cloud Run"],
      answer: 0,
      why: "AlloyDB is PostgreSQL-compatible with a stronger analytics story than vanilla Cloud SQL."
    },
    {
      q: "Raw JSON and Parquet land daily. You want BigQuery security and SQL without loading every file into native tables first.",
      choices: ["BigLake / external tables", "Memorystore", "Cloud SQL import", "Firebase Auth"],
      answer: 0,
      why: "BigLake / external tables query the lake in place with warehouse controls."
    },
    {
      q: "Row keys are `2026-09-24T18:00:00#deviceId`. Writes stall at high QPS. Why?",
      choices: [
        "Bigtable cannot store timestamps",
        "Monotonic timestamp prefix hotspots one tablet",
        "You forgot BI Engine",
        "Composer needs more workers"
      ],
      answer: 1,
      why: "Field promotion / hash / device-first keys spread writes. Time-first keys follow the clock onto one tablet."
    },
    {
      q: "Data not read for 90 days should get cheaper without an app change. Mechanism?",
      choices: [
        "GCS lifecycle or Autoclass (and BQ long-term storage for untouched tables)",
        "Delete the bucket every Friday",
        "Move everything to Spanner",
        "Turn off CMEK"
      ],
      answer: 0,
      why: "Lifecycle policies (or Autoclass) are the exam’s cost lever for objects. BigQuery also discounts long-term storage."
    }
  ],
  analyze: [
    {
      q: "Looker Studio on a 8 TB table is fine at 06:00 and times out at 09:00 when the company is awake. First capacity idea?",
      choices: [
        "Delete partitions",
        "BigQuery reservations / Editions so ETL batch does not steal interactive slots",
        "Move the dashboard to Bigtable",
        "Disable IAM"
      ],
      answer: 1,
      why: "Slot contention is a reservation problem. Separate interactive and batch assignments."
    },
    {
      q: "A dashboard always shows yesterday’s revenue by country. Queries still scan months. Best table design tweak?",
      choices: [
        "Partition by event_date and cluster by country",
        "SELECT * into a spreadsheet",
        "Store each country in its own GCP organization",
        "Turn on Cloud Armor"
      ],
      answer: 0,
      why: "Partition prune to yesterday; cluster helps the country filter/aggregation."
    },
    {
      q: "Churn prediction from features that already live in BigQuery, owned by SQL analysts. First ML path to consider?",
      choices: ["Build a custom TPU cluster by hand", "BigQuery ML", "Train inside Cloud SQL triggers", "Pub/Sub only"],
      answer: 1,
      why: "BQML is the guide’s in-warehouse ML. PMLE-style custom training is another exam."
    },
    {
      q: "You must publish a curated dataset to partner orgs without emailing extracts. Product?",
      choices: ["Analytics Hub / BigQuery sharing", "Transfer Appliance to their office", "Public GCS with list:true", "Screenshot of Looker"],
      answer: 0,
      why: "Analytics Hub is the named sharing product. Public buckets are not a partnership strategy."
    },
    {
      q: "Unstructured PDFs must support retrieval-augmented generation. Your job as data engineer is primarily to…",
      choices: [
        "Fine-tune a 70B model from scratch on Dataproc",
        "Chunk, embed, store vectors + metadata, keep PII controls",
        "Put the PDFs in Memorystore",
        "Ban SQL"
      ],
      answer: 1,
      why: "The guide’s AI bullet is preparation: embeddings and RAG data, not owning foundation-model training."
    },
    {
      q: "A query does SELECT * on a 50-column fact table for a 3-column chart. What should you scream first?",
      choices: [
        "Bytes scanned / column pruning — project only needed columns",
        "Buy Spanner",
        "Disable BI Engine forever",
        "The chart needs Cloud DLP"
      ],
      answer: 0,
      why: "Columnar warehouses charge and slow down on columns you do not need. Fix the SELECT list, then views/MVs."
    },
    {
      q: "Which feature caches hot BigQuery results for BI tools?",
      choices: ["Transfer Appliance", "BI Engine", "Cloud Armor", "Datastream"],
      answer: 1,
      why: "BI Engine is the in-memory acceleration layer for visualization."
    }
  ],
  operate: [
    {
      q: "Nightly Spark is 40 minutes. The cluster sits idle 23 hours. Cost fix?",
      choices: [
        "Persistent Dataproc cluster, maximum size, always on",
        "Ephemeral / job-scoped Dataproc (autoscaled) per DAG run",
        "Move Spark into Firestore",
        "Disable monitoring so you stop seeing the bill"
      ],
      answer: 1,
      why: "The guide literally asks you to choose persistent vs job-based clusters. Job-based wins here."
    },
    {
      q: "You need a repeatable graph of tasks with retries and date catchup. Artifact?",
      choices: ["A Composer DAG", "A screenshot in Drive", "A Bigtable row", "An org policy denying DAGs"],
      answer: 0,
      why: "DAGs in Cloud Composer are the exam’s repeatability primitive."
    },
    {
      q: "A BigQuery job failed with a quota error. Correct first read?",
      choices: [
        "The eu region evaporated",
        "You hit a project/region quota or concurrent-job limit — inspect error + quotas, then backoff or request increase",
        "CMEK always causes quota errors",
        "Composer cannot run SQL"
      ],
      answer: 1,
      why: "Quota is an operations problem, not an outage fairy tale."
    },
    {
      q: "How do you see who scanned 12 TB yesterday?",
      choices: [
        "BigQuery INFORMATION_SCHEMA / admin insights + Cloud Logging",
        "Ask Bigtable",
        "Ping Cloud CDN",
        "Only Google Support can know"
      ],
      answer: 0,
      why: "INFORMATION_SCHEMA job metadata is the warehouse audit trail."
    },
    {
      q: "A region fails. Which design actually helped?",
      choices: [
        "Single-zone Cloud SQL with backups turned off",
        "Multi-region serving / cross-region replicas and a tested failover",
        "One VM cron in that zone",
        "Storing the only copy on a laptop"
      ],
      answer: 1,
      why: "The maintain domain explicitly includes multi-region/zone and DB failover."
    },
    {
      q: "A file arrives with a broken schema and would poison the fact table. Healthy pattern?",
      choices: [
        "Fail the whole company dashboard until someone notices next week",
        "Quarantine bad files/rows, alert, keep good data flowing",
        "Overwrite prod with the bad file to stay current",
        "Delete Cloud Logging so there is no evidence"
      ],
      answer: 1,
      why: "Missing/corrupt data is an expected failure mode. Isolate and continue."
    },
    {
      q: "Interactive Looker queries and a 6-hour batch ELT share one on-demand project. Batch keeps winning. Fix?",
      choices: [
        "Reservations: assign slots to interactive vs batch workloads",
        "Ban Looker",
        "Store dashboards in Archive class GCS",
        "Switch the warehouse to Firestore"
      ],
      answer: 0,
      why: "Capacity management with Editions/reservations is an official subsection."
    }
  ]
};

window.PDE_DOJO = [
  {
    id: "click",
    title: "Clickstream minute metrics",
    setup: "10M events/hour, need 1-minute aggregations with late events up to 15 minutes, dashboards in SQL.",
    options: ["Pub/Sub + Dataflow + BigQuery", "Cloud SQL stored procedures", "Firestore listeners", "Transfer Appliance hourly"],
    answer: 0,
    why: "Classic stream path: bus + windowed processor + warehouse."
  },
  {
    id: "oracle",
    title: "Oracle to warehouse, continuous",
    setup: "Source is Oracle. Analysts want near-real-time tables. Source DBA forbids nightly full dumps.",
    options: ["Datastream into BigQuery", "Manual CSV on a USB stick", "Memorystore replica", "Cloud CDN origin"],
    answer: 0,
    why: "CDC with Datastream is the low-impact continuous path."
  },
  {
    id: "spark",
    title: "Hadoop hangover",
    setup: "Hive + Spark SQL, 80 jobs, little Beam talent this year.",
    options: ["Dataproc first", "Rewrite in Apps Script", "Put HDFS in Filestore and pray", "AlloyDB only"],
    answer: 0,
    why: "Meet the estate where it is."
  },
  {
    id: "pii",
    title: "PII warehouse",
    setup: "Marketing wants email and phone in dashboards. Legal says raw PII is restricted to a 4-person team.",
    options: ["Policy tags + authorized views / masked columns + DLP on copies", "Public dataset", "Slack the CSV", "Disable audit logs"],
    answer: 0,
    why: "Share products, not raw identifiers."
  },
  {
    id: "iot",
    title: "Factory sensors",
    setup: "200k writes/sec, key lookup by machine id + time range, no SQL analysts on the hot path.",
    options: ["Bigtable with machine-first row keys", "BigQuery on-demand per write", "One Cloud SQL instance", "Composer workers as a database"],
    answer: 0,
    why: "This is the poster workload for Bigtable."
  },
  {
    id: "share",
    title: "Partner exchange",
    setup: "Retail partner should query a curated, updated product-quality dataset. They have their own GCP org.",
    options: ["Analytics Hub listing", "Email Parquet every Monday", "Give them org admin on your org", "Post objects as AllUsers"],
    answer: 0,
    why: "Hub is how Google wants dataset products published."
  },
  {
    id: "cost",
    title: "Bill shock",
    setup: "Same dashboard, 20x bytes billed after an intern wrote SELECT * FROM huge_fact.",
    options: ["Authorized view projecting columns + partition filter required + slot/reservation hygiene", "Migrate to three Cloud SQL instances", "Turn off invoices", "Use Archive class for active fact tables"],
    answer: 0,
    why: "Control projection, force partition filters, separate capacity."
  },
  {
    id: "orch",
    title: "Morning estate",
    setup: "12 jobs with dependencies, retry rules, and business-date catchup after holidays.",
    options: ["Cloud Composer DAG", "A human checklist in chat", "12 unrelated Cloud Schedulers with hope", "Bigtable TTL"],
    answer: 0,
    why: "That is an Airflow-shaped graph."
  }
];

window.PDE_CARDS = {
  design: [
    ["IAM inheritance direction?", "Org → folder → project → resource. Children inherit parents."],
    ["CMEK vs Google-managed?", "CMEK when you must disable/rotate/revoke the key yourself."],
    ["How do you change a BQ dataset region?", "You don’t in place. Copy to a new dataset location."],
    ["DLP’s job vs IAM’s job?", "DLP finds/masks sensitive values. IAM decides who may call APIs / see columns."],
    ["VPC-SC in one sentence?", "Perimeter that blocks data exfiltration from Google APIs even with leaked keys."],
    ["Datastream vs DMS?", "Datastream = CDC to analytics/lake. DMS = migrate the database runtime to Cloud SQL/AlloyDB."],
    ["Transfer Appliance when?", "Network cannot move the volume in the window."],
    ["Prod isolation unit?", "Separate projects (often separate folders), not just datasets."]
  ],
  ingest: [
    ["Default Pub/Sub delivery?", "At-least-once. Make sinks idempotent."],
    ["Beam watermark?", "Guess of event-time completeness. Behind it = late."],
    ["Session window?", "Groups by inactivity gap, not a fixed clock bucket."],
    ["Dataflow vs Dataproc?", "Dataflow = Beam serverless batch+stream. Dataproc = managed Spark/Hadoop."],
    ["Dataform vs Fusion?", "Dataform = SQL ELT in BQ. Fusion = visual ETL/CDC."],
    ["Composer vs Workflows?", "Composer = Airflow. Workflows = light API orchestration."],
    ["Flex templates?", "Versioned, CI-built Dataflow jobs you deploy instead of laptop jars."],
    ["ELT vs ETL pick?", "ELT when BQ/Dataform can transform cheaper; ETL when you must cleanse before landing."]
  ],
  store: [
    ["Warehouse default?", "BigQuery."],
    ["Lake file default?", "Cloud Storage + lifecycle / BigLake to query."],
    ["Hot time series default?", "Bigtable, device-first keys."],
    ["Global SQL transactions?", "Spanner."],
    ["Regional Postgres lift?", "Cloud SQL. Heavier hybrid analytics: AlloyDB."],
    ["Document app state?", "Firestore."],
    ["Hotspot row key?", "Monotonic timestamp at the left of the key."],
    ["Partition column choice?", "The date almost every query filters."]
  ],
  analyze: [
    ["BI Engine?", "In-memory acceleration for BI on BigQuery."],
    ["Materialized view?", "Precomputed query result maintained by BigQuery."],
    ["BQML when?", "Features already in BQ, SQL team, warehouse-shaped models."],
    ["RAG data job?", "Chunk, embed, store vectors + metadata, govern PII."],
    ["Analytics Hub?", "Publish/subscribe curated datasets across projects/orgs."],
    ["Dashboard slowness at 9am?", "Slot contention and/or unpruned scans."],
    ["Authorized view?", "Share a slice without granting the base table."],
    ["SELECT * sin?", "You pay and wait for columns the chart does not use."]
  ],
  operate: [
    ["Persistent vs job Dataproc?", "Job/ephemeral unless you truly need a long-lived cluster."],
    ["Reservation point?", "Guarantee slots and isolate interactive from batch."],
    ["INFORMATION_SCHEMA?", "Who ran what, bytes, errors, time."],
    ["Quota error meaning?", "Limit hit, not necessarily a platform outage."],
    ["Idempotent load?", "Replay does not duplicate facts (MERGE, partition replace)."],
    ["Quarantine pattern?", "Bad file/row aside, good data still ships."],
    ["Multi-region why?", "Survive a region; meet residency separately."],
    ["DAG rule?", "Orchestrate; do not bury 3k lines of Spark in the DAG file."]
  ]
};
