-- Additional tables to support progress tracking, attempts and interventions
CREATE TABLE ova_progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    ova_id INT,
    read_time INT,
    perc_scrolled INT,
    completed BOOLEAN DEFAULT FALSE,
    last_access DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ova_id) REFERENCES ovas(ova_id) ON DELETE CASCADE ON UPDATE CASCADE,
    -- one progress row per (student, ova) — the API upserts it
    CONSTRAINT uc_ova_progress UNIQUE (student_id, ova_id)
);

CREATE TABLE attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    question_id INT,
    is_correct BOOLEAN,
    attempt_time DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE interventions (
    intervention_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    date DATE,
    type VARCHAR(50),
    description TEXT,
    result VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- MELHORIA (4.1): resources now carries the hosting-agnostic media abstraction:
-- resource_url can point to a self-hosted file (S3/local) or an external embed
-- (YouTube/Spotify); media_type tells the player how to interpret the URL.
-- resource_type: 'texto' | 'video' | 'podcast' | 'quiz' | 'atividade'
CREATE TABLE resources (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    ova_id INT,
    resource_type VARCHAR(50),
    resource_title VARCHAR(255),
    resource_url TEXT,
    media_type VARCHAR(30),
    duration_seconds INT,
    FOREIGN KEY (ova_id) REFERENCES ovas(ova_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- MELHORIA (4.1): per-student consumption of each resource
-- (video: % watched / podcast: listening seconds / atividade: completed flag)
CREATE TABLE resource_progress (
    resource_progress_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    resource_id INT,
    perc_consumed INT DEFAULT 0,
    seconds_consumed INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_access DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uc_resource_progress UNIQUE (student_id, resource_id)
);
