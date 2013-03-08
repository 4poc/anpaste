-- postgres database scheme

CREATE USER paste WITH PASSWORD '<CHANGE PASSWORD>';

DROP DATABASE IF EXISTS paste;
CREATE DATABASE paste
    WITH OWNER = paste
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    CONNECTION LIMIT = -1;
GRANT ALL PRIVILEGES ON DATABASE paste to paste;

\c paste

DROP TABLE IF EXISTS paste;
CREATE TABLE paste (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    summary TEXT,
    content TEXT,
    secret VARCHAR(16), -- random key can be used to delete or edit
    expire TIMESTAMP WITH TIME ZONE,
    created TIMESTAMP WITH TIME ZONE,
    encrypted BOOLEAN,
    language VARCHAR(32),
    private BOOLEAN
);
ALTER TABLE paste OWNER TO paste;


