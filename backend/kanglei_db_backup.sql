--
-- PostgreSQL database dump
--

\restrict RFD7D5rDvbTsSooj9gTb9HNAMEXapmBZ2q4yUkYh0cONxYliMTQHuExoAmf8gOF

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: kanglei; Type: SCHEMA; Schema: -; Owner: kanglei_user
--

CREATE SCHEMA kanglei;


ALTER SCHEMA kanglei OWNER TO kanglei_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: kanglei; Owner: kanglei_user
--

CREATE TABLE kanglei.admin_users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kanglei.admin_users OWNER TO kanglei_user;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: kanglei; Owner: kanglei_user
--

CREATE SEQUENCE kanglei.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kanglei.admin_users_id_seq OWNER TO kanglei_user;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: kanglei; Owner: kanglei_user
--

ALTER SEQUENCE kanglei.admin_users_id_seq OWNED BY kanglei.admin_users.id;


--
-- Name: appointments; Type: TABLE; Schema: kanglei; Owner: kanglei_user
--

CREATE TABLE kanglei.appointments (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(30) NOT NULL,
    address character varying(300),
    message text,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    counseling_type character varying(100) DEFAULT 'General Counseling'::character varying NOT NULL
);


ALTER TABLE kanglei.appointments OWNER TO kanglei_user;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: kanglei; Owner: kanglei_user
--

CREATE SEQUENCE kanglei.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kanglei.appointments_id_seq OWNER TO kanglei_user;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: kanglei; Owner: kanglei_user
--

ALTER SEQUENCE kanglei.appointments_id_seq OWNED BY kanglei.appointments.id;


--
-- Name: event_posters; Type: TABLE; Schema: kanglei; Owner: kanglei_user
--

CREATE TABLE kanglei.event_posters (
    id integer NOT NULL,
    title character varying(200),
    image_path character varying(500) NOT NULL,
    is_active boolean NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kanglei.event_posters OWNER TO kanglei_user;

--
-- Name: event_posters_id_seq; Type: SEQUENCE; Schema: kanglei; Owner: kanglei_user
--

CREATE SEQUENCE kanglei.event_posters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kanglei.event_posters_id_seq OWNER TO kanglei_user;

--
-- Name: event_posters_id_seq; Type: SEQUENCE OWNED BY; Schema: kanglei; Owner: kanglei_user
--

ALTER SEQUENCE kanglei.event_posters_id_seq OWNED BY kanglei.event_posters.id;


--
-- Name: gallery_posts; Type: TABLE; Schema: kanglei; Owner: kanglei_user
--

CREATE TABLE kanglei.gallery_posts (
    id integer NOT NULL,
    image_path character varying(500) NOT NULL,
    caption character varying(300),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kanglei.gallery_posts OWNER TO kanglei_user;

--
-- Name: gallery_posts_id_seq; Type: SEQUENCE; Schema: kanglei; Owner: kanglei_user
--

CREATE SEQUENCE kanglei.gallery_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE kanglei.gallery_posts_id_seq OWNER TO kanglei_user;

--
-- Name: gallery_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: kanglei; Owner: kanglei_user
--

ALTER SEQUENCE kanglei.gallery_posts_id_seq OWNED BY kanglei.gallery_posts.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: kanglei_user
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_users OWNER TO kanglei_user;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: kanglei_user
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_id_seq OWNER TO kanglei_user;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kanglei_user
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: kanglei_user
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(30) NOT NULL,
    address character varying(300),
    message text,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    counseling_type character varying(100) DEFAULT 'General Counseling'::character varying NOT NULL
);


ALTER TABLE public.appointments OWNER TO kanglei_user;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: kanglei_user
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO kanglei_user;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kanglei_user
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: event_posters; Type: TABLE; Schema: public; Owner: kanglei_user
--

CREATE TABLE public.event_posters (
    id integer NOT NULL,
    title character varying(200),
    image_path character varying(500) NOT NULL,
    is_active boolean NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_posters OWNER TO kanglei_user;

--
-- Name: event_posters_id_seq; Type: SEQUENCE; Schema: public; Owner: kanglei_user
--

CREATE SEQUENCE public.event_posters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_posters_id_seq OWNER TO kanglei_user;

--
-- Name: event_posters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kanglei_user
--

ALTER SEQUENCE public.event_posters_id_seq OWNED BY public.event_posters.id;


--
-- Name: gallery_posts; Type: TABLE; Schema: public; Owner: kanglei_user
--

CREATE TABLE public.gallery_posts (
    id integer NOT NULL,
    image_path character varying(500) NOT NULL,
    caption character varying(300),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gallery_posts OWNER TO kanglei_user;

--
-- Name: gallery_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: kanglei_user
--

CREATE SEQUENCE public.gallery_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gallery_posts_id_seq OWNER TO kanglei_user;

--
-- Name: gallery_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kanglei_user
--

ALTER SEQUENCE public.gallery_posts_id_seq OWNED BY public.gallery_posts.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.admin_users ALTER COLUMN id SET DEFAULT nextval('kanglei.admin_users_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.appointments ALTER COLUMN id SET DEFAULT nextval('kanglei.appointments_id_seq'::regclass);


--
-- Name: event_posters id; Type: DEFAULT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.event_posters ALTER COLUMN id SET DEFAULT nextval('kanglei.event_posters_id_seq'::regclass);


--
-- Name: gallery_posts id; Type: DEFAULT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.gallery_posts ALTER COLUMN id SET DEFAULT nextval('kanglei.gallery_posts_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: event_posters id; Type: DEFAULT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.event_posters ALTER COLUMN id SET DEFAULT nextval('public.event_posters_id_seq'::regclass);


--
-- Name: gallery_posts id; Type: DEFAULT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.gallery_posts ALTER COLUMN id SET DEFAULT nextval('public.gallery_posts_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: kanglei; Owner: kanglei_user
--

COPY kanglei.admin_users (id, username, password_hash, role, is_active, created_at) FROM stdin;
1	admin	$2b$12$cB0/MSj1UISfO1P/aFscjem4DhBE9W427mkkCCQocIp39ox4quZtO	superadmin	t	2026-02-03 20:32:34.987941+05:30
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: kanglei; Owner: kanglei_user
--

COPY kanglei.appointments (id, name, phone, address, message, status, created_at, counseling_type) FROM stdin;
5	ghbfdg	999999999	reftgwersgf	sdagfvasdgfsdg	CONTACTED	2026-02-03 21:24:04.847082+05:30	Career Counseling
1	Abinash	9876543210	Imphal	Career guidance	CONTACTED	2026-02-03 20:33:42.533689+05:30	General Counseling
\.


--
-- Data for Name: event_posters; Type: TABLE DATA; Schema: kanglei; Owner: kanglei_user
--

COPY kanglei.event_posters (id, title, image_path, is_active, starts_at, ends_at, created_at) FROM stdin;
9	\N	/home/abinashheishnam21/Desktop/kanglei-career-solution_BACKUP_20260205_001950/backend/app/static_uploads/events/3184bacefee949fc8798f082a0f25471.jpeg	t	\N	\N	2026-02-05 01:49:31.777476+05:30
\.


--
-- Data for Name: gallery_posts; Type: TABLE DATA; Schema: kanglei; Owner: kanglei_user
--

COPY kanglei.gallery_posts (id, image_path, caption, is_active, created_at) FROM stdin;
8	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/8c0016af531c4d398b03d8ffb09b86ab.png	\N	t	2026-02-04 02:41:21.078474+05:30
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: kanglei_user
--

COPY public.admin_users (id, username, password_hash, role, is_active, created_at) FROM stdin;
1	admin	$2b$12$HbYMzFjtnFIEyWZHREYm4.egm34fYV52Vow52sqvx6RSR3VOCVCGy	admin	t	2026-02-05 18:11:32.559312+05:30
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: kanglei_user
--

COPY public.appointments (id, name, phone, address, message, status, created_at, counseling_type) FROM stdin;
2	Abinash Heishnam	9366659018	Kangla Palace, NH202, New Lambulane, Porompat, Imphal East, Manipur, 795001, India	\N	NEW	2026-02-05 18:05:11.103422+05:30	Skill Development
5	Abinash Heishnam	9366659018	Kangla Palace, NH202, New Lambulane, Porompat, Imphal East, Manipur, 795001, India	szdxfc	NEW	2026-02-05 18:29:10.958941+05:30	Skill Development
10	Lamjingba Khoirom	7085731916	Northeast	Finally on server	NEW	2026-02-07 01:14:44.39159+05:30	Career Counseling
\.


--
-- Data for Name: event_posters; Type: TABLE DATA; Schema: public; Owner: kanglei_user
--

COPY public.event_posters (id, title, image_path, is_active, starts_at, ends_at, created_at) FROM stdin;
2	Kanglei MBA	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/events/0fd4e405a6cb4eb4918c28d881e136df.jpeg	t	\N	\N	2026-02-05 21:18:48.916047+05:30
9	\N	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/events/c76b9fb186c54509b62c561d1aa8200f.webp	t	2026-02-07 11:08:00+05:30	\N	2026-02-07 11:06:14.111489+05:30
\.


--
-- Data for Name: gallery_posts; Type: TABLE DATA; Schema: public; Owner: kanglei_user
--

COPY public.gallery_posts (id, image_path, caption, is_active, created_at) FROM stdin;
11	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/977a36aee7544d5288a0ad55b5c43dc3.jpeg	\N	t	2026-02-06 22:02:24.847406+05:30
15	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/8f3e3b7d28ea4c70a366c73c2377a675.webp	\N	t	2026-02-07 02:15:02.311392+05:30
16	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/073cfb419fb34d019632a9970cbe78f0.webp	\N	t	2026-02-07 02:15:09.660516+05:30
17	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/7672175545454b6fafe1956cc4d373a9.webp	\N	t	2026-02-07 02:15:13.925656+05:30
18	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/46492df4e42146f78629c40bfe2a2fb8.webp	\N	t	2026-02-07 02:15:21.629576+05:30
19	/home/abinashheishnam21/Desktop/kanglei-career-solution/backend/app/static_uploads/gallery/fc8578e331494885999b022dad2e0a94.webp	\N	t	2026-02-07 02:15:32.434552+05:30
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: kanglei; Owner: kanglei_user
--

SELECT pg_catalog.setval('kanglei.admin_users_id_seq', 1, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: kanglei; Owner: kanglei_user
--

SELECT pg_catalog.setval('kanglei.appointments_id_seq', 7, true);


--
-- Name: event_posters_id_seq; Type: SEQUENCE SET; Schema: kanglei; Owner: kanglei_user
--

SELECT pg_catalog.setval('kanglei.event_posters_id_seq', 10, true);


--
-- Name: gallery_posts_id_seq; Type: SEQUENCE SET; Schema: kanglei; Owner: kanglei_user
--

SELECT pg_catalog.setval('kanglei.gallery_posts_id_seq', 8, true);


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kanglei_user
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kanglei_user
--

SELECT pg_catalog.setval('public.appointments_id_seq', 10, true);


--
-- Name: event_posters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kanglei_user
--

SELECT pg_catalog.setval('public.event_posters_id_seq', 9, true);


--
-- Name: gallery_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: kanglei_user
--

SELECT pg_catalog.setval('public.gallery_posts_id_seq', 19, true);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: event_posters event_posters_pkey; Type: CONSTRAINT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.event_posters
    ADD CONSTRAINT event_posters_pkey PRIMARY KEY (id);


--
-- Name: gallery_posts gallery_posts_pkey; Type: CONSTRAINT; Schema: kanglei; Owner: kanglei_user
--

ALTER TABLE ONLY kanglei.gallery_posts
    ADD CONSTRAINT gallery_posts_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: event_posters event_posters_pkey; Type: CONSTRAINT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.event_posters
    ADD CONSTRAINT event_posters_pkey PRIMARY KEY (id);


--
-- Name: gallery_posts gallery_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: kanglei_user
--

ALTER TABLE ONLY public.gallery_posts
    ADD CONSTRAINT gallery_posts_pkey PRIMARY KEY (id);


--
-- Name: ix_kanglei_admin_users_id; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE INDEX ix_kanglei_admin_users_id ON kanglei.admin_users USING btree (id);


--
-- Name: ix_kanglei_admin_users_username; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE UNIQUE INDEX ix_kanglei_admin_users_username ON kanglei.admin_users USING btree (username);


--
-- Name: ix_kanglei_appointments_id; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE INDEX ix_kanglei_appointments_id ON kanglei.appointments USING btree (id);


--
-- Name: ix_kanglei_appointments_phone; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE INDEX ix_kanglei_appointments_phone ON kanglei.appointments USING btree (phone);


--
-- Name: ix_kanglei_event_posters_id; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE INDEX ix_kanglei_event_posters_id ON kanglei.event_posters USING btree (id);


--
-- Name: ix_kanglei_gallery_posts_id; Type: INDEX; Schema: kanglei; Owner: kanglei_user
--

CREATE INDEX ix_kanglei_gallery_posts_id ON kanglei.gallery_posts USING btree (id);


--
-- Name: ix_admin_users_id; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE INDEX ix_admin_users_id ON public.admin_users USING btree (id);


--
-- Name: ix_admin_users_username; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE UNIQUE INDEX ix_admin_users_username ON public.admin_users USING btree (username);


--
-- Name: ix_appointments_id; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE INDEX ix_appointments_id ON public.appointments USING btree (id);


--
-- Name: ix_appointments_phone; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE INDEX ix_appointments_phone ON public.appointments USING btree (phone);


--
-- Name: ix_event_posters_id; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE INDEX ix_event_posters_id ON public.event_posters USING btree (id);


--
-- Name: ix_gallery_posts_id; Type: INDEX; Schema: public; Owner: kanglei_user
--

CREATE INDEX ix_gallery_posts_id ON public.gallery_posts USING btree (id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO kanglei_user;


--
-- PostgreSQL database dump complete
--

\unrestrict RFD7D5rDvbTsSooj9gTb9HNAMEXapmBZ2q4yUkYh0cONxYliMTQHuExoAmf8gOF

