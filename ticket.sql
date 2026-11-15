--
-- PostgreSQL database dump
--

\restrict mI0kiDUOIcsMpsIXdD7gQP9iy6Yvvr0eJYG6gslXoJBF7i214hL4euzozf2WRMr

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-11-15 18:59:20

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 16491)
-- Name: Билет; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Билет" (
    "id_Билета" integer NOT NULL,
    "id_Места" integer NOT NULL,
    "Статус" character varying(50) NOT NULL,
    "id_Мероприятия" integer NOT NULL,
    "id_Типа" integer NOT NULL,
    "id_Заказа" integer NOT NULL,
    "Цена" numeric(10,2) NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 16490)
-- Name: Билет_id_Билета_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Билет_id_Билета_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 231
-- Name: Билет_id_Билета_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Билет_id_Билета_seq" OWNED BY public."Билет"."id_Билета";


--
-- TOC entry 228 (class 1259 OID 16459)
-- Name: Заказ; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Заказ" (
    "id_Заказа" integer NOT NULL,
    "Дата_Заказа" timestamp without time zone NOT NULL,
    "Статус" character varying(50) NOT NULL,
    "id_Клиента" integer NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16458)
-- Name: Заказ_id_Заказа_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Заказ_id_Заказа_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 227
-- Name: Заказ_id_Заказа_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Заказ_id_Заказа_seq" OWNED BY public."Заказ"."id_Заказа";


--
-- TOC entry 220 (class 1259 OID 16402)
-- Name: Клиент; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Клиент" (
    "id_Клиента" integer NOT NULL,
    "ФИО" character varying(200) NOT NULL,
    email character varying(150) NOT NULL,
    "Телефон" character varying(30),
    "Дата_Регистрации" timestamp without time zone NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16401)
-- Name: Клиент_id_Клиента_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Клиент_id_Клиента_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 219
-- Name: Клиент_id_Клиента_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Клиент_id_Клиента_seq" OWNED BY public."Клиент"."id_Клиента";


--
-- TOC entry 226 (class 1259 OID 16443)
-- Name: Мероприятие; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Мероприятие" (
    "id_Мероприятия" integer NOT NULL,
    "Название" character varying(200) NOT NULL,
    "Дата" timestamp without time zone NOT NULL,
    "id_Площадки" integer NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16442)
-- Name: Мероприятие_id_Мероприятия_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Мероприятие_id_Мероприятия_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 225
-- Name: Мероприятие_id_Мероприятия_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Мероприятие_id_Мероприятия_seq" OWNED BY public."Мероприятие"."id_Мероприятия";


--
-- TOC entry 224 (class 1259 OID 16426)
-- Name: Места; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Места" (
    "id_Места" integer NOT NULL,
    "id_Площадки" integer NOT NULL,
    "Ряд" integer NOT NULL,
    "Номер" integer NOT NULL,
    "Тип_Места" character varying(50) NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16425)
-- Name: Места_id_Места_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Места_id_Места_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 223
-- Name: Места_id_Места_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Места_id_Места_seq" OWNED BY public."Места"."id_Места";


--
-- TOC entry 222 (class 1259 OID 16413)
-- Name: Площадка; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Площадка" (
    "id_Площадки" integer NOT NULL,
    "Название" character varying(150) NOT NULL,
    "Адрес" character varying(255) NOT NULL,
    "Вместимость" integer NOT NULL,
    "Схема_Мест" character varying(255)
);


--
-- TOC entry 221 (class 1259 OID 16412)
-- Name: Площадка_id_Площадки_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Площадка_id_Площадки_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 221
-- Name: Площадка_id_Площадки_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Площадка_id_Площадки_seq" OWNED BY public."Площадка"."id_Площадки";


--
-- TOC entry 230 (class 1259 OID 16475)
-- Name: Тип_Билета; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Тип_Билета" (
    "id_Типа" integer NOT NULL,
    "Название" character varying(100) NOT NULL,
    "Цена" numeric(10,2) NOT NULL,
    "id_Мероприятия" integer NOT NULL,
    "Тип_Места" character varying(50) NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 16474)
-- Name: Тип_Билета_id_Типа_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Тип_Билета_id_Типа_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 229
-- Name: Тип_Билета_id_Типа_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Тип_Билета_id_Типа_seq" OWNED BY public."Тип_Билета"."id_Типа";


--
-- TOC entry 4892 (class 2604 OID 16494)
-- Name: Билет id_Билета; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет" ALTER COLUMN "id_Билета" SET DEFAULT nextval('public."Билет_id_Билета_seq"'::regclass);


--
-- TOC entry 4890 (class 2604 OID 16462)
-- Name: Заказ id_Заказа; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Заказ" ALTER COLUMN "id_Заказа" SET DEFAULT nextval('public."Заказ_id_Заказа_seq"'::regclass);


--
-- TOC entry 4886 (class 2604 OID 16405)
-- Name: Клиент id_Клиента; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Клиент" ALTER COLUMN "id_Клиента" SET DEFAULT nextval('public."Клиент_id_Клиента_seq"'::regclass);


--
-- TOC entry 4889 (class 2604 OID 16446)
-- Name: Мероприятие id_Мероприятия; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Мероприятие" ALTER COLUMN "id_Мероприятия" SET DEFAULT nextval('public."Мероприятие_id_Мероприятия_seq"'::regclass);


--
-- TOC entry 4888 (class 2604 OID 16429)
-- Name: Места id_Места; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Места" ALTER COLUMN "id_Места" SET DEFAULT nextval('public."Места_id_Места_seq"'::regclass);


--
-- TOC entry 4887 (class 2604 OID 16416)
-- Name: Площадка id_Площадки; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Площадка" ALTER COLUMN "id_Площадки" SET DEFAULT nextval('public."Площадка_id_Площадки_seq"'::regclass);


--
-- TOC entry 4891 (class 2604 OID 16478)
-- Name: Тип_Билета id_Типа; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Тип_Билета" ALTER COLUMN "id_Типа" SET DEFAULT nextval('public."Тип_Билета_id_Типа_seq"'::regclass);


--
-- TOC entry 5075 (class 0 OID 16491)
-- Dependencies: 232
-- Data for Name: Билет; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Билет" ("id_Билета", "id_Места", "Статус", "id_Мероприятия", "id_Типа", "id_Заказа", "Цена") FROM stdin;
1	1	sold	1	1	1	5000.00
2	2	sold	1	1	1	5000.00
3	90	reserved	1	2	2	2000.00
4	101	cancelled	2	4	3	3000.00
5	102	cancelled	2	4	3	3000.00
6	201	sold	3	5	4	1200.00
7	202	sold	3	5	4	1200.00
8	203	sold	3	5	4	1200.00
9	145	sold	5	7	5	1000.00
10	1	sold	2	3	6	6500.00
\.


--
-- TOC entry 5071 (class 0 OID 16459)
-- Dependencies: 228
-- Data for Name: Заказ; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Заказ" ("id_Заказа", "Дата_Заказа", "Статус", "id_Клиента") FROM stdin;
1	2026-11-03 18:08:18.708032	paid	1
2	2026-11-14 18:08:18.708032	new	2
3	2026-11-10 18:08:18.708032	cancelled	3
4	2026-11-12 18:08:18.708032	paid	4
5	2026-10-06 18:08:18.708032	paid	1
6	2026-11-15 18:30:03.506607	paid	1
\.


--
-- TOC entry 5063 (class 0 OID 16402)
-- Dependencies: 220
-- Data for Name: Клиент; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Клиент" ("id_Клиента", "ФИО", email, "Телефон", "Дата_Регистрации") FROM stdin;
1	Иванов Иван Иванович	ivan.ivanov@seed.example	+7 900 111-11-11	2026-09-16 18:08:18.708032
2	Петрова Мария Сергеевна	maria.petrova@seed.example	+7 900 222-22-22	2026-09-16 18:08:18.708032
3	Сидоров Пётр Алексеевич	petr.sidorov@seed.example	\N	2026-09-16 18:08:18.708032
4	Кузнецова Анна Дмитриевна	anna.kuznetsova@seed.example	+7 900 444-44-44	2026-09-16 18:08:18.708032
5	Смирнов Алексей Олегович	alexey.smirnov@seed.example	+7 900 555-55-55	2026-09-16 18:08:18.708032
\.


--
-- TOC entry 5069 (class 0 OID 16443)
-- Dependencies: 226
-- Data for Name: Мероприятие; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Мероприятие" ("id_Мероприятия", "Название", "Дата", "id_Площадки") FROM stdin;
1	Концерт симфонического оркестра	2026-12-15 19:00:00	1
2	Рок-фестиваль	2026-12-30 18:00:00	1
3	Камерный вечер	2026-11-29 19:00:00	2
4	Стендап-шоу	2026-12-06 20:00:00	2
5	Новогодний концерт (прошедший)	2026-10-16 19:00:00	1
\.


--
-- TOC entry 5067 (class 0 OID 16426)
-- Dependencies: 224
-- Data for Name: Места; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Места" ("id_Места", "id_Площадки", "Ряд", "Номер", "Тип_Места") FROM stdin;
1	1	1	1	VIP
2	1	1	2	VIP
3	1	1	3	VIP
4	1	1	4	VIP
5	1	1	5	VIP
6	1	1	6	VIP
7	1	1	7	VIP
8	1	1	8	VIP
9	1	1	9	VIP
10	1	1	10	VIP
11	1	1	11	VIP
12	1	1	12	VIP
13	1	1	13	VIP
14	1	1	14	VIP
15	1	1	15	VIP
16	1	1	16	VIP
17	1	1	17	VIP
18	1	1	18	VIP
19	1	1	19	VIP
20	1	1	20	VIP
21	1	2	1	VIP
22	1	2	2	VIP
23	1	2	3	VIP
24	1	2	4	VIP
25	1	2	5	VIP
26	1	2	6	VIP
27	1	2	7	VIP
28	1	2	8	VIP
29	1	2	9	VIP
30	1	2	10	VIP
31	1	2	11	VIP
32	1	2	12	VIP
33	1	2	13	VIP
34	1	2	14	VIP
35	1	2	15	VIP
36	1	2	16	VIP
37	1	2	17	VIP
38	1	2	18	VIP
39	1	2	19	VIP
40	1	2	20	VIP
41	1	3	1	VIP
42	1	3	2	VIP
43	1	3	3	VIP
44	1	3	4	VIP
45	1	3	5	VIP
46	1	3	6	VIP
47	1	3	7	VIP
48	1	3	8	VIP
49	1	3	9	VIP
50	1	3	10	VIP
51	1	3	11	VIP
52	1	3	12	VIP
53	1	3	13	VIP
54	1	3	14	VIP
55	1	3	15	VIP
56	1	3	16	VIP
57	1	3	17	VIP
58	1	3	18	VIP
59	1	3	19	VIP
60	1	3	20	VIP
61	1	4	1	Партер
62	1	4	2	Партер
63	1	4	3	Партер
64	1	4	4	Партер
65	1	4	5	Партер
66	1	4	6	Партер
67	1	4	7	Партер
68	1	4	8	Партер
69	1	4	9	Партер
70	1	4	10	Партер
71	1	4	11	Партер
72	1	4	12	Партер
73	1	4	13	Партер
74	1	4	14	Партер
75	1	4	15	Партер
76	1	4	16	Партер
77	1	4	17	Партер
78	1	4	18	Партер
79	1	4	19	Партер
80	1	4	20	Партер
81	1	5	1	Партер
82	1	5	2	Партер
83	1	5	3	Партер
84	1	5	4	Партер
85	1	5	5	Партер
86	1	5	6	Партер
87	1	5	7	Партер
88	1	5	8	Партер
89	1	5	9	Партер
90	1	5	10	Партер
91	1	5	11	Партер
92	1	5	12	Партер
93	1	5	13	Партер
94	1	5	14	Партер
95	1	5	15	Партер
96	1	5	16	Партер
97	1	5	17	Партер
98	1	5	18	Партер
99	1	5	19	Партер
100	1	5	20	Партер
101	1	6	1	Партер
102	1	6	2	Партер
103	1	6	3	Партер
104	1	6	4	Партер
105	1	6	5	Партер
106	1	6	6	Партер
107	1	6	7	Партер
108	1	6	8	Партер
109	1	6	9	Партер
110	1	6	10	Партер
111	1	6	11	Партер
112	1	6	12	Партер
113	1	6	13	Партер
114	1	6	14	Партер
115	1	6	15	Партер
116	1	6	16	Партер
117	1	6	17	Партер
118	1	6	18	Партер
119	1	6	19	Партер
120	1	6	20	Партер
121	1	7	1	Партер
122	1	7	2	Партер
123	1	7	3	Партер
124	1	7	4	Партер
125	1	7	5	Партер
126	1	7	6	Партер
127	1	7	7	Партер
128	1	7	8	Партер
129	1	7	9	Партер
130	1	7	10	Партер
131	1	7	11	Партер
132	1	7	12	Партер
133	1	7	13	Партер
134	1	7	14	Партер
135	1	7	15	Партер
136	1	7	16	Партер
137	1	7	17	Партер
138	1	7	18	Партер
139	1	7	19	Партер
140	1	7	20	Партер
141	1	8	1	Партер
142	1	8	2	Партер
143	1	8	3	Партер
144	1	8	4	Партер
145	1	8	5	Партер
146	1	8	6	Партер
147	1	8	7	Партер
148	1	8	8	Партер
149	1	8	9	Партер
150	1	8	10	Партер
151	1	8	11	Партер
152	1	8	12	Партер
153	1	8	13	Партер
154	1	8	14	Партер
155	1	8	15	Партер
156	1	8	16	Партер
157	1	8	17	Партер
158	1	8	18	Партер
159	1	8	19	Партер
160	1	8	20	Партер
161	1	9	1	Партер
162	1	9	2	Партер
163	1	9	3	Партер
164	1	9	4	Партер
165	1	9	5	Партер
166	1	9	6	Партер
167	1	9	7	Партер
168	1	9	8	Партер
169	1	9	9	Партер
170	1	9	10	Партер
171	1	9	11	Партер
172	1	9	12	Партер
173	1	9	13	Партер
174	1	9	14	Партер
175	1	9	15	Партер
176	1	9	16	Партер
177	1	9	17	Партер
178	1	9	18	Партер
179	1	9	19	Партер
180	1	9	20	Партер
181	1	10	1	Партер
182	1	10	2	Партер
183	1	10	3	Партер
184	1	10	4	Партер
185	1	10	5	Партер
186	1	10	6	Партер
187	1	10	7	Партер
188	1	10	8	Партер
189	1	10	9	Партер
190	1	10	10	Партер
191	1	10	11	Партер
192	1	10	12	Партер
193	1	10	13	Партер
194	1	10	14	Партер
195	1	10	15	Партер
196	1	10	16	Партер
197	1	10	17	Партер
198	1	10	18	Партер
199	1	10	19	Партер
200	1	10	20	Партер
201	2	1	1	Стандарт
202	2	1	2	Стандарт
203	2	1	3	Стандарт
204	2	1	4	Стандарт
205	2	1	5	Стандарт
206	2	1	6	Стандарт
207	2	1	7	Стандарт
208	2	1	8	Стандарт
209	2	1	9	Стандарт
210	2	1	10	Стандарт
211	2	2	1	Стандарт
212	2	2	2	Стандарт
213	2	2	3	Стандарт
214	2	2	4	Стандарт
215	2	2	5	Стандарт
216	2	2	6	Стандарт
217	2	2	7	Стандарт
218	2	2	8	Стандарт
219	2	2	9	Стандарт
220	2	2	10	Стандарт
221	2	3	1	Стандарт
222	2	3	2	Стандарт
223	2	3	3	Стандарт
224	2	3	4	Стандарт
225	2	3	5	Стандарт
226	2	3	6	Стандарт
227	2	3	7	Стандарт
228	2	3	8	Стандарт
229	2	3	9	Стандарт
230	2	3	10	Стандарт
231	2	4	1	Стандарт
232	2	4	2	Стандарт
233	2	4	3	Стандарт
234	2	4	4	Стандарт
235	2	4	5	Стандарт
236	2	4	6	Стандарт
237	2	4	7	Стандарт
238	2	4	8	Стандарт
239	2	4	9	Стандарт
240	2	4	10	Стандарт
241	2	5	1	Стандарт
242	2	5	2	Стандарт
243	2	5	3	Стандарт
244	2	5	4	Стандарт
245	2	5	5	Стандарт
246	2	5	6	Стандарт
247	2	5	7	Стандарт
248	2	5	8	Стандарт
249	2	5	9	Стандарт
250	2	5	10	Стандарт
\.


--
-- TOC entry 5065 (class 0 OID 16413)
-- Dependencies: 222
-- Data for Name: Площадка; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Площадка" ("id_Площадки", "Название", "Адрес", "Вместимость", "Схема_Мест") FROM stdin;
1	[Тест] Большой зал	Москва, ул. Тверская, 1	300	maps/big-hall.svg
2	[Тест] Камерная сцена	Санкт-Петербург, Невский пр., 10	100	\N
3	Крокус Сити Холл	Москва, 66-й км МКАД	6200	maps/crocus.svg
\.


--
-- TOC entry 5073 (class 0 OID 16475)
-- Dependencies: 230
-- Data for Name: Тип_Билета; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Тип_Билета" ("id_Типа", "Название", "Цена", "id_Мероприятия", "Тип_Места") FROM stdin;
1	VIP	5000.00	1	VIP
2	Партер	2000.00	1	Партер
3	VIP	6500.00	2	VIP
4	Партер	3000.00	2	Партер
5	Стандарт	1200.00	3	Стандарт
6	Стандарт	1500.00	4	Стандарт
7	Партер	1000.00	5	Партер
\.


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 231
-- Name: Билет_id_Билета_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Билет_id_Билета_seq"', 10, true);


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 227
-- Name: Заказ_id_Заказа_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Заказ_id_Заказа_seq"', 6, true);


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 219
-- Name: Клиент_id_Клиента_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Клиент_id_Клиента_seq"', 5, true);


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 225
-- Name: Мероприятие_id_Мероприятия_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Мероприятие_id_Мероприятия_seq"', 5, true);


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 223
-- Name: Места_id_Места_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Места_id_Места_seq"', 250, true);


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 221
-- Name: Площадка_id_Площадки_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Площадка_id_Площадки_seq"', 3, true);


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 229
-- Name: Тип_Билета_id_Типа_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Тип_Билета_id_Типа_seq"', 7, true);


--
-- TOC entry 4906 (class 2606 OID 16502)
-- Name: Билет Билет_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет"
    ADD CONSTRAINT "Билет_pkey" PRIMARY KEY ("id_Билета");


--
-- TOC entry 4902 (class 2606 OID 16468)
-- Name: Заказ Заказ_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Заказ"
    ADD CONSTRAINT "Заказ_pkey" PRIMARY KEY ("id_Заказа");


--
-- TOC entry 4894 (class 2606 OID 16411)
-- Name: Клиент Клиент_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Клиент"
    ADD CONSTRAINT "Клиент_pkey" PRIMARY KEY ("id_Клиента");


--
-- TOC entry 4900 (class 2606 OID 16452)
-- Name: Мероприятие Мероприятие_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Мероприятие"
    ADD CONSTRAINT "Мероприятие_pkey" PRIMARY KEY ("id_Мероприятия");


--
-- TOC entry 4898 (class 2606 OID 16436)
-- Name: Места Места_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Места"
    ADD CONSTRAINT "Места_pkey" PRIMARY KEY ("id_Места");


--
-- TOC entry 4896 (class 2606 OID 16424)
-- Name: Площадка Площадка_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Площадка"
    ADD CONSTRAINT "Площадка_pkey" PRIMARY KEY ("id_Площадки");


--
-- TOC entry 4904 (class 2606 OID 16484)
-- Name: Тип_Билета Тип_Билета_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Тип_Билета"
    ADD CONSTRAINT "Тип_Билета_pkey" PRIMARY KEY ("id_Типа");


--
-- Name: Тип_Билета ticket_types_event_seat_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Тип_Билета"
    ADD CONSTRAINT ticket_types_event_seat_type_key UNIQUE ("id_Мероприятия", "Тип_Места");


--
-- TOC entry 4911 (class 2606 OID 16518)
-- Name: Билет Билет_id_Заказа_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет"
    ADD CONSTRAINT "Билет_id_Заказа_fkey" FOREIGN KEY ("id_Заказа") REFERENCES public."Заказ"("id_Заказа");


--
-- TOC entry 4912 (class 2606 OID 16508)
-- Name: Билет Билет_id_Мероприятия_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет"
    ADD CONSTRAINT "Билет_id_Мероприятия_fkey" FOREIGN KEY ("id_Мероприятия") REFERENCES public."Мероприятие"("id_Мероприятия");


--
-- TOC entry 4913 (class 2606 OID 16503)
-- Name: Билет Билет_id_Места_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет"
    ADD CONSTRAINT "Билет_id_Места_fkey" FOREIGN KEY ("id_Места") REFERENCES public."Места"("id_Места");


--
-- TOC entry 4914 (class 2606 OID 16513)
-- Name: Билет Билет_id_Типа_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Билет"
    ADD CONSTRAINT "Билет_id_Типа_fkey" FOREIGN KEY ("id_Типа") REFERENCES public."Тип_Билета"("id_Типа");


--
-- TOC entry 4909 (class 2606 OID 16469)
-- Name: Заказ Заказ_id_Клиента_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Заказ"
    ADD CONSTRAINT "Заказ_id_Клиента_fkey" FOREIGN KEY ("id_Клиента") REFERENCES public."Клиент"("id_Клиента");


--
-- TOC entry 4908 (class 2606 OID 16453)
-- Name: Мероприятие Мероприятие_id_Площадки_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Мероприятие"
    ADD CONSTRAINT "Мероприятие_id_Площадки_fkey" FOREIGN KEY ("id_Площадки") REFERENCES public."Площадка"("id_Площадки");


--
-- TOC entry 4907 (class 2606 OID 16437)
-- Name: Места Места_id_Площадки_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Места"
    ADD CONSTRAINT "Места_id_Площадки_fkey" FOREIGN KEY ("id_Площадки") REFERENCES public."Площадка"("id_Площадки");


--
-- TOC entry 4910 (class 2606 OID 16485)
-- Name: Тип_Билета Тип_Билета_id_Мероприятия_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Тип_Билета"
    ADD CONSTRAINT "Тип_Билета_id_Мероприятия_fkey" FOREIGN KEY ("id_Мероприятия") REFERENCES public."Мероприятие"("id_Мероприятия");


-- Completed on 2026-11-15 18:59:21

--
-- PostgreSQL database dump complete
--

\unrestrict mI0kiDUOIcsMpsIXdD7gQP9iy6Yvvr0eJYG6gslXoJBF7i214hL4euzozf2WRMr

