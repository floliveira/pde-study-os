window.PDE_CONTENT = {
  ranks: [
    { xp: 0, name: "Analyst intern" },
    { xp: 120, name: "Junior data engineer" },
    { xp: 300, name: "Pipeline builder" },
    { xp: 520, name: "Warehouse lead" },
    { xp: 800, name: "Streaming specialist" },
    { xp: 1150, name: "Platform engineer" },
    { xp: 1600, name: "Professional Data Engineer" }
  ],
  domains: [
    {
      id: "design",
      n: 1,
      weight: 22,
      color: "d1",
      title: "Designing data processing systems",
      blurb: "Security, reliability, portability, and migrations. You design the system before you write the pipeline.",
      topics: [
        {
          id: "sec",
          title: "Security, privacy, and compliance",
          minutes: 18,
          summary: "Lock data with IAM, encryption, DLP, and location — not with hope.",
          body: [
            "Google Cloud IAM is hierarchical: organization → folder → project → resource. Child resources inherit parent policies. Least privilege means the job's service account gets only the roles it needs (bigquery.dataEditor on one dataset, not roles/owner on the project).",
            "Encryption at rest is on by default with Google-managed keys. Choose CMEK (Cloud KMS) when the prompt requires customer-controlled rotation, revocation, or regulatory key custody. CSEK is rare and operationally painful — only if the scenario forbids Google from seeing key material.",
            "Cloud DLP (Sensitive Data Protection) discovers, inspects, and de-identifies PII. Pair it with BigQuery policy tags for column-level access: analysts can query the table but not the raw national ID column.",
            "Dataset location is a compliance control. EU personal data that must stay in the EU belongs in an EU region or eu multi-region. You cannot change a BigQuery dataset location in place; you copy. That is a design-time decision.",
            "VPC Service Controls build a perimeter around projects so stolen credentials cannot exfiltrate BigQuery or GCS to the public internet. Use them when the threat model is data theft, not just IAM mistakes.",
            "Split environments: separate GCP projects for prod and non-prod. Prod service accounts never deploy from a laptop. Organization policies can deny public buckets, disable service account key creation, and force CMEK."
          ],
          chips: ["IAM", "CMEK", "DLP", "policy tags", "VPC-SC", "residency"]
        },
        {
          id: "reli",
          title: "Reliability, fidelity, and data quality",
          minutes: 14,
          summary: "Pipelines must survive failure and refuse silent garbage.",
          body: [
            "Fidelity means the data that lands matches the source after cleaning. Use Dataform assertions, Dataflow dead-letter queues, BigQuery DML constraints where they exist, and validation queries after loads.",
            "ACID matters when two writers can conflict. Cloud SQL, Spanner, and AlloyDB give transactional guarantees. BigQuery is analytical: streaming inserts can be eventually consistent for query; storage write API improves that. Do not pick BigQuery as an OLTP system of record.",
            "Disaster recovery: RPO/RTO drive multi-region vs regional. BigQuery multi-region datasets already replicate inside the multi-region. Cloud SQL needs HA + backups + optional cross-region replica. GCS dual-region or turbo replication for faster RPO.",
            "Prompting LLMs to generate SQL is in the official guide as a cleaning/prep technique. Treat generated SQL like any other code: review, test on a sample, never grant it prod write blindly."
          ],
          chips: ["Dataform tests", "DLQ", "RPO/RTO", "ACID vs analytics"]
        },
        {
          id: "flex",
          title: "Flexibility, portability, governance",
          minutes: 12,
          summary: "Design so tomorrow's source, region, or team does not force a rewrite.",
          body: [
            "Portability: prefer open formats in the lake (Parquet/Avro/ORC on GCS) and SQL in the warehouse. Dataproc lets you keep Spark if you must leave later. Dataflow/Beam also runs outside GCP, which is the portability argument vs a proprietary-only transform.",
            "Dataplex (and Dataplex Catalog) is how Google wants you to catalog, classify, and govern data across lakes and warehouses. A data mesh is a federated governance model: domains own their products; a central catalog and policy layer keeps them discoverable and safe.",
            "Stage raw data first (GCS or raw BigQuery dataset), then curated, then serving. Never let analysts mutate raw. That three-layer layout is the architecture most exam scenarios expect when they say 'governance'."
          ],
          chips: ["Dataplex", "data mesh", "open formats", "medallion layers"]
        },
        {
          id: "mig",
          title: "Designing migrations",
          minutes: 14,
          summary: "Match the mover to the source: CDC, dump, SaaS, or a truck.",
          body: [
            "Datastream: change data capture from Oracle/MySQL/PostgreSQL (and similar) into BigQuery or GCS with low impact on the source. Use when you need continuous sync, not a one-off dump.",
            "Database Migration Service: lift-and-shift databases onto Cloud SQL / AlloyDB with minimal downtime. Different job from analytics CDC.",
            "BigQuery Data Transfer Service: scheduled ingest from SaaS and Google products (Ads, Search Ads, YouTube, S3, Teradata connectors depending on availability). Not a general Beam tool.",
            "Storage Transfer Service: object data GCS ↔ S3 ↔ on-prem agents. Transfer Appliance: physical device when the network cannot move petabytes in the required window.",
            "Always plan validation: row counts, checksums, reconciliation queries, dual-running period, rollback. Networking (VPN/Interconnect, firewalls, private IPs) is part of the migration design, not an afterthought."
          ],
          chips: ["Datastream", "DMS", "BQ DTS", "Transfer Appliance"]
        }
      ]
    },
    {
      id: "ingest",
      n: 2,
      weight: 25,
      color: "d2",
      title: "Ingesting and processing the data",
      blurb: "Largest domain. Batch vs stream, the right processor, windows, and how jobs actually run in production.",
      topics: [
        {
          id: "plan",
          title: "Planning pipelines",
          minutes: 12,
          summary: "Sources, sinks, transform logic, network, encryption — on paper first.",
          body: [
            "Write the contract: volume, velocity, schema drift, allowed latency, exactly-once vs at-least-once, PII, and who consumes the sink.",
            "ELT (load then transform in BigQuery/Dataform) wins when the warehouse can do the work cheaper than a cluster. ETL (Dataflow/Dataproc/Fusion before load) wins when you must cleanse, tokenize, or fan-out before landing.",
            "Encrypt in transit (TLS is default on Google APIs). Encrypt at rest. If data crosses projects or orgs, name the service accounts and the perimeter."
          ],
          chips: ["ELT vs ETL", "contracts", "schema drift"]
        },
        {
          id: "build",
          title: "Building batch and streaming pipelines",
          minutes: 22,
          summary: "Service selection is the exam. Windowing is how they fail people who only know batch.",
          body: [
            "Dataflow runs Apache Beam. One programming model for batch and stream. Use it for windowed aggregations, exactly-once sinks, and messy transforms. Concepts: PCollection, ParDo, GroupByKey, side inputs, windows, watermarks, triggers, allowed lateness.",
            "Fixed windows slice time into equal buckets. Sliding windows overlap (rolling metrics). Session windows group by inactivity gap (user sessions). The watermark estimates event-time completeness. Data after the watermark is late; you either drop it, put it in a late pane, or send it to a dead letter.",
            "Pub/Sub is the ingest bus: fan-out, replay via seek, dead-letter topics, at-least-once delivery. It is not a database and not a windowing engine.",
            "Dataproc is managed Spark/Hadoop/Flink. Choose it when the company already has Spark jobs, Hive tables, or HDFS-era tooling. Ephemeral clusters for jobs; persistent only if you have a real reason (HBase, interactive notebooks, long-lived YARN).",
            "Cloud Data Fusion is visual CDC/ETL for teams that will not write Beam. Dataform is SQL-first transformation and testing inside BigQuery. BigQuery itself can ingest load jobs, streaming inserts, and Storage Write API.",
            "AI enrichment (document AI, translation, entity extraction) belongs in the pipeline when the scenario needs structured fields from unstructured inputs — before or after landing, depending on cost."
          ],
          chips: ["Dataflow", "Beam windows", "Pub/Sub", "Dataproc", "Dataform", "Data Fusion"]
        },
        {
          id: "ops",
          title: "Deploying and operationalizing pipelines",
          minutes: 12,
          summary: "A pipeline that only runs in a notebook is not production.",
          body: [
            "Cloud Composer is managed Apache Airflow. Use DAGs when you have many dependent jobs, retries, sensors, and a team that already thinks in Airflow. Workflows is lighter: JSON/YAML orchestration of Google APIs without a GKE-sized Airflow bill.",
            "CI/CD for Dataflow: Flex Templates built in Cloud Build, versioned in Artifact Registry / GCS, deployed with infra as code. Never 'run this jar from my laptop' in prod.",
            "Idempotency: loads should be replayable. Use load-date partitions, MERGE on business keys, or Beam's exactly-once sinks so a retry does not duplicate facts."
          ],
          chips: ["Composer", "Workflows", "Flex templates", "idempotency"]
        }
      ]
    },
    {
      id: "store",
      n: 3,
      weight: 20,
      color: "d3",
      title: "Storing the data",
      blurb: "Access patterns pick the store. Cost and lifecycle keep you employed.",
      topics: [
        {
          id: "select",
          title: "Selecting storage systems",
          minutes: 18,
          summary: "If you remember one page from this site, remember this matrix.",
          body: [
            "BigQuery: analytical warehouse. Columnar, separates storage and compute, SQL, BI, BQML. Seconds of latency is fine; milliseconds is not.",
            "Cloud Storage: objects. Landing zone, data lake files, backups, ML corpora, static assets. Classes: Standard, Nearline, Coldline, Archive. Lifecycle rules move or delete. Autoclass if access is unpredictable.",
            "Bigtable: wide-column, millisecond, huge throughput. Time series, IoT, ad tech, financial ticks. Row key design is the product. Hot tablet = you put a timestamp prefix on every key.",
            "Spanner: globally consistent relational. External consistency, horizontal scale, SQL. Expensive. Use when you need multi-region transactions, not for a 20 GB app DB.",
            "Cloud SQL: regional managed MySQL/Postgres/SQL Server. Lift-and-shift OLTP. HA failover, replicas, backups.",
            "AlloyDB: PostgreSQL-compatible, stronger analytical + transactional hybrid than vanilla Cloud SQL. Good when the prompt wants Postgres compatibility and heavy reads/analytics on operational data.",
            "Firestore: document / mobile-sync. Memorystore: Redis/Memcached cache. Do not warehouse in either."
          ],
          chips: ["BigQuery", "GCS", "Bigtable", "Spanner", "Cloud SQL", "AlloyDB"]
        },
        {
          id: "wh",
          title: "Planning the warehouse",
          minutes: 12,
          summary: "Model for the questions the business actually asks.",
          body: [
            "Star schemas still work: facts partitioned by date, dimensions clustered by high-cardinality filters you always use together. Wide denormalized tables are acceptable in BigQuery because storage is cheap and joins are the expensive part.",
            "Partition by ingestion date or event date — the column almost every query filters. Cluster by 1–4 columns used in filters/joins after partition pruning. Do not over-partition into tiny 1 MB partitions.",
            "Normalization reduces write anomalies; denormalization reduces join cost. Warehouse lean denormalized. OLTP lean normalized. The exam will hand you a workload and expect that distinction."
          ],
          chips: ["partition", "cluster", "star schema", "denorm"]
        },
        {
          id: "lake",
          title: "Data lakes and the platform",
          minutes: 12,
          summary: "Files plus governance, not a swamp of CSV.",
          body: [
            "A lake is GCS (and sometimes BigQuery raw) with discovery, IAM, and cost controls. BigLake lets you query those files with BigQuery security and performance features without loading everything.",
            "Dataplex organizes lakes → zones → assets, attaches catalog metadata, quality checks, and unified IAM. Analytics Hub / BigQuery sharing publishes curated datasets to other projects or orgs.",
            "Federated governance: each domain team owns its product; Dataplex Catalog makes it findable; policy tags and lake IAM keep it from becoming public."
          ],
          chips: ["BigLake", "Dataplex", "Analytics Hub", "zones"]
        }
      ]
    },
    {
      id: "analyze",
      n: 4,
      weight: 15,
      color: "d4",
      title: "Preparing and using data for analysis",
      blurb: "Make dashboards fast, models fed, and shares safe. You are not the ML engineer.",
      topics: [
        {
          id: "viz",
          title: "Preparing data for visualization",
          minutes: 12,
          summary: "Slow dashboards are usually a modeling problem, not a Looker problem.",
          body: [
            "BI Engine caches hot BigQuery results in memory for Looker/Looker Studio and other BI tools. Materialized views pre-aggregate. Authorized views expose a slice without giving the table away.",
            "Troubleshoot slowness: check job details for bytes scanned, whether partition/cluster pruning happened, whether SELECT * murdered you, whether you joined two unpartitioned monsters. Slot contention looks like 'it is fast at 7am and dead at 9am' — reservations fix that.",
            "Precalculate fields the dashboard always needs. Do not make Looker Studio compute a 4-billion-row cohort every load."
          ],
          chips: ["BI Engine", "materialized views", "bytes scanned", "slots"]
        },
        {
          id: "ml",
          title: "Preparing data for AI and ML",
          minutes: 12,
          summary: "Feature tables and embeddings, not custom training loops.",
          body: [
            "BigQuery ML trains models with SQL (linear, boosted trees, time series, matrix factorization, imported TensorFlow, remote models). Use it when the data already lives in BigQuery and the team is SQL-native.",
            "Feature prep: no leakage from the future, consistent training/serving transforms, documented feature store-ish tables. Unstructured data for RAG: chunk documents, generate embeddings, store vectors (BigQuery vector search or a vector index) and metadata for filters.",
            "You prepare and land the data. Vertex training details belong more to the ML Engineer exam. If the scenario is 'predict churn from a warehouse table', BQML is the intended hammer."
          ],
          chips: ["BigQuery ML", "features", "embeddings", "RAG prep"]
        },
        {
          id: "share",
          title: "Sharing data",
          minutes: 8,
          summary: "Publish products, not raw dumps.",
          body: [
            "Analytics Hub (BigQuery sharing) lists exchanges of datasets. Subscribers get a linked dataset. You keep lineage and can revoke.",
            "Authorized datasets/views share within an org without copying. Column security still applies. Do not email a CSV of customers."
          ],
          chips: ["Analytics Hub", "authorized views", "exchanges"]
        }
      ]
    },
    {
      id: "operate",
      n: 5,
      weight: 18,
      color: "d5",
      title: "Maintaining and automating data workloads",
      blurb: "Cost, capacity, DAGs, monitoring, and what you do when a job dies at 2am.",
      topics: [
        {
          id: "opt",
          title: "Optimizing resources and cost",
          minutes: 12,
          summary: "Enough capacity for the CEO dashboard. Not enough to scan the lake twice.",
          body: [
            "BigQuery Editions and reservations assign slots to teams/workloads. Separate INTERACTIVE and BATCH reservation assignments so a huge ETL does not stall Looker.",
            "Dataproc: ephemeral job clusters beat always-on for most batch. Autoscaling, preemptible/spot secondaries for fault-tolerant Spark.",
            "GCS lifecycle and BigQuery long-term storage discounts reward stillness. Partition + cluster so you do not scan 12 TB to answer 'yesterday'."
          ],
          chips: ["Editions", "reservations", "ephemeral Dataproc", "lifecycle"]
        },
        {
          id: "auto",
          title: "Automation and repeatability",
          minutes: 10,
          summary: "If it is not a DAG or a scheduler, it is a ritual.",
          body: [
            "Composer DAGs: operators, sensors, retries, SLAs, catchup. Keep DAGs idempotent. Parameterize dates. Do not put giant Spark logic inside the DAG file — the DAG only orchestrates.",
            "Cloud Scheduler + Workflows or Composer covers cron. BigQuery scheduled queries are fine for simple SQL estate. Event-driven: Pub/Sub message kicks Workflows/Dataflow."
          ],
          chips: ["DAGs", "Scheduler", "scheduled queries"]
        },
        {
          id: "mon",
          title: "Monitoring, troubleshooting, failure",
          minutes: 14,
          summary: "Observability is how you prove the pipeline is a product.",
          body: [
            "Cloud Monitoring metrics + Cloud Logging for Dataflow/Composer/BigQuery. BigQuery admin panel / INFORMATION_SCHEMA tells you who scanned what and which jobs failed.",
            "Quota errors are not 'the service is down'. Billing spikes after SELECT * on a 100 TB table are a design bug.",
            "Fault tolerance: Dataflow retries bundles; Composer retries tasks; BigQuery load jobs can be restarted if you wrote idempotently. Multi-region serving when a region burns. Cloud SQL HA + failover replica. Expect missing files and schema breaks — land them in a quarantine table instead of failing the whole day."
          ],
          chips: ["Monitoring", "Logging", "INFORMATION_SCHEMA", "failover"]
        }
      ]
    }
  ],
  services: [
    { name: "BigQuery", use: "Warehouse SQL, BI, BQML, large scans", not: "Millisecond OLTP or global transactions" },
    { name: "Cloud Storage", use: "Lake files, landing, backups, objects", not: "Indexed query or row updates" },
    { name: "BigLake", use: "Governed query over lake files", not: "Replacing an operational database" },
    { name: "Bigtable", use: "Wide-column, time series, huge QPS", not: "Ad-hoc multi-row SQL analytics" },
    { name: "Spanner", use: "Global relational consistency", not: "Cheap regional CMS or a lake" },
    { name: "Cloud SQL", use: "Regional MySQL/Postgres OLTP lift", not: "Petabyte analytics" },
    { name: "AlloyDB", use: "Postgres + heavier analytics on OLTP", not: "Multi-continent external consistency (that's Spanner)" },
    { name: "Firestore", use: "Document app state, mobile sync", not: "Warehouse or IoT time series at Bigtable scale" },
    { name: "Memorystore", use: "Hot cache, session, leaderboards", not: "Source of truth" },
    { name: "Pub/Sub", use: "Ingest bus, fan-out, replay", not: "Windowed compute or long-term store" },
    { name: "Dataflow", use: "Beam batch+stream, windows, exactly-once", not: "Unchanged Spark/Hive estates" },
    { name: "Dataproc", use: "Managed Spark/Hadoop you already have", not: "Greenfield serverless streaming" },
    { name: "Dataform", use: "SQL ELT, tests, environments in BQ", not: "Binary/image transforms" },
    { name: "Data Fusion", use: "Visual ETL/CDC, mixed skill teams", not: "Ultra-low-latency custom Beam" },
    { name: "Datastream", use: "CDC from operational DBs", not: "SaaS marketing exports (DTS)" },
    { name: "Composer", use: "Airflow DAGs, rich dependencies", not: "A single API call chain (Workflows)" },
    { name: "Workflows", use: "Lightweight Google API orchestration", not: "500-task Hadoop estate" },
    { name: "Dataplex", use: "Lake governance, catalog, quality", not: "The query engine itself" },
    { name: "Analytics Hub", use: "Publish/subscribe datasets", not: "Row-level OLTP sharing" },
    { name: "Cloud DLP", use: "Find/mask PII", not: "Authorization (that's IAM + policy tags)" }
  ],
  badges: [
    { id: "first-topic", name: "Lights on", hint: "Complete your first topic" },
    { id: "all-design", name: "Architect's pencil", hint: "Complete Design domain topics" },
    { id: "all-ingest", name: "Ingest mechanic", hint: "Complete Ingest topics" },
    { id: "all-store", name: "Storage picker", hint: "Complete Store topics" },
    { id: "all-analyze", name: "Dashboard medic", hint: "Complete Analyze topics" },
    { id: "all-operate", name: "Night-shift SRE", hint: "Complete Operate topics" },
    { id: "quiz-80", name: "Sharpshooter", hint: "Score 80%+ on any domain quiz" },
    { id: "quiz-all", name: "Five-domain threat", hint: "Pass every domain quiz at 80%" },
    { id: "dojo-5", name: "Decision dojo", hint: "Clear 5 dojo scenarios" },
    { id: "mock", name: "Exam stamina", hint: "Finish a timed mock" },
    { id: "streak-3", name: "Three-day fuse", hint: "Study 3 days in a row" },
    { id: "level-pde", name: "Ready enough", hint: "Reach Professional Data Engineer rank" }
  ]
};
