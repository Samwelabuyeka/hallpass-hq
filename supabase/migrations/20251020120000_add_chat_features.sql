-- Create the chats table
CREATE TABLE public.chats (
    id bigint NOT NULL,
    name character varying,
    type character varying NOT NULL, -- e.g., 'private', 'group'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.chats OWNER TO postgres;
CREATE SEQUENCE public.chats_id_seq
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

-- Create the chat_participants table
CREATE TABLE public.chat_participants (
    id bigint NOT NULL,
    chat_id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    chat_id bigint NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.messages OWNER TO postgres;
CREATE SEQUENCE public.messages_id_seq
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
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create the calls table
CREATE TABLE public.calls (
    id bigint NOT NULL,
    caller_id uuid NOT NULL,
    status character varying, -- e.g., 'ongoing', 'ended', 'missed'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    chat_id bigint,
    type character varying
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
    ADD CONSTRAINT calls_caller_id_fkey FOREIGN KEY (caller_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.calls
    ADD CONSTRAINT calls_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create the call_participants table
CREATE TABLE public.call_participants (
    id bigint NOT NULL,
    call_id bigint NOT NULL,
    user_id uuid NOT NULL,
    status character varying, -- e.g., 'joined', 'left'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.call_participants OWNER TO postgres;
CREATE SEQUENCE public.call_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.call_participants_id_seq OWNER TO postgres;
ALTER SEQUENCE public.call_participants_id_seq OWNED BY public.call_participants.id;
ALTER TABLE ONLY public.call_participants ALTER COLUMN id SET DEFAULT nextval('public.call_participants_id_seq'::regclass);
ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_call_id_fkey FOREIGN KEY (call_id) REFERENCES public.calls(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
