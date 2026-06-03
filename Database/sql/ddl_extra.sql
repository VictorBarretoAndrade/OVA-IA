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
    FOREIGN KEY (ova_id) REFERENCES ovas(ova_id) ON DELETE CASCADE ON UPDATE CASCADE
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

CREATE TABLE resources (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    ova_id INT,
    resource_type VARCHAR(50),
    resource_title VARCHAR(255),
    FOREIGN KEY (ova_id) REFERENCES ovas(ova_id) ON DELETE CASCADE ON UPDATE CASCADE
);
