BEGIN;
CREATE TABLE commission_ratings (
 commission text PRIMARY KEY REFERENCES commissions(id),
 customer text NOT NULL REFERENCES accounts(id),
 artist text NOT NULL REFERENCES accounts(id),
 score integer NOT NULL CHECK(score BETWEEN 1 AND 5),
 created bigint NOT NULL,
 updated bigint NOT NULL
);
CREATE INDEX commission_ratings_artist ON commission_ratings(artist);
-- PostgreSQL privileges
ALTER TABLE commission_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON commission_ratings FROM PUBLIC,anon,authenticated;
COMMIT;
