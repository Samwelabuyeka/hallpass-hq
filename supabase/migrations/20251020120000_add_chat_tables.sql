
-- Create the user_connections table
CREATE TABLE public.user_connections (
    id bigint NOT NULL,
    user_a_id uuid NOT NULL,
    user_b_id uuid NOT NULL,
    status character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.user_connections OWNER TO postgres;
CREATE SEQUENCE public.user_connections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.user_connections_id_seq OWNER TO postgres;
ALTER SEQUENCE public.user_connections_id_seq OWNED BY public.user_connections.id;
ALTER TABLE ONLY public.user_connections ALTER COLUMN id SET DEFAULT nextval('public.user_connections_id_seq'::regclass);
ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_a_id_fkey FOREIGN KEY (user_a_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_b_id_fkey FOREIGN KEY (user_b_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Create the chats table
CREATE TABLE public.chats (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying,
    is_group_chat boolean DEFAULT false NOT NULL,
    created_by uuid
);

ALTER TABLE public.chats OWNER TO postgres;
CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.chats_id_seq OWNER TO postgres;
ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;
ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);
ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- Create the chat_participants table
CREATE TABLE public.chat_participants (
    id bigint NOT NULL,
    chat_id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_admin boolean DEFAULT false NOT NULL
);

ALTER TABLE public.chat_participants OWNER TO postgres;
CREATE SEQUENCE public.chat_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.chat_participants_id_seq OWNER TO postgres;
ALTER SEQUENCE public.chat_participants_id_seq OWNED BY public.chat_participants.id;
ALTER TABLE ONLY public.chat_participants ALTER COLUMN id SET DEFAULT nextval('public.chat_participants_id_seq'::regclass);
ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create the messages table
CREATE TABLE public.messages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    chat_id bigint,
    user_id uuid,
    content text,
    media_url character varying
);
ALTER TABLE public.messages OWNER TO postgres;
CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.messages_id_seq OWNER TO postgres;
ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;
ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- Create the calls table
CREATE TABLE public.calls (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    initiator_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status character varying NOT NULL, -- e.g., 'initiated', 'answered', 'declined', 'ended'
    duration_seconds integer,
    ended_at timestamp with time zone
);

ALTER TABLE public.calls OWNER TO postgres;
CREATE SEQUENCE public.calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.calls_id_seq OWNER TO postgres;
ALTER SEQUENCE public.calls_id_seq OWNED BY public.calls.id;
ALTER TABLE ONLY public.calls ALTER COLUMN id SET DEFAULT nextval('public.calls_id_seq'::regclass);
ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_initiator_id_fkey FOREIGN KEY (initiator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.calls
    ADD CONSTRAINT calls_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
