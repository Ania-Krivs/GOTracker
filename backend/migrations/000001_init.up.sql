


CREATE TABLE admins (
    id VARCHAR(255) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_password VARCHAR(255) NOT NULL
);

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, 
    name VARCHAR(255) NOT NULL,
    code INT UNIQUE NOT NULL,   
    admin_id VARCHAR(255),  
    
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) 
        REFERENCES admins(id) 
        ON DELETE SET NULL
);