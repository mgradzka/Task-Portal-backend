USE [WAD-MMD-CSD-S21_10407745]
GO

--------------- 1) dropping all the tables and contraints
ALTER TABLE jobPassword
DROP CONSTRAINT IF EXISTS jobFK_Password_Account
GO
DROP TABLE IF EXISTS jobPassword
GO

ALTER TABLE jobApplication
DROP CONSTRAINT IF EXISTS jobFK_Application_Task
GO
ALTER TABLE jobApplication
DROP CONSTRAINT IF EXISTS jobFK_Application_Account
GO
DROP TABLE IF EXISTS jobApplication
GO

ALTER TABLE jobTask
DROP CONSTRAINT IF EXISTS jobFK_Task_Account 
GO
ALTER TABLE jobTask
DROP CONSTRAINT IF EXISTS jobFK_Task_Category
GO
ALTER TABLE jobTask
DROP CONSTRAINT IF EXISTS jobFK_Task_Status
GO
DROP TABLE IF EXISTS jobTask
GO

ALTER TABLE jobAccount
DROP CONSTRAINT IF EXISTS jobFK_Account_Profile 
GO
ALTER TABLE jobAccount
DROP CONSTRAINT IF EXISTS jobFK_Account_Role
GO
DROP TABLE IF EXISTS jobAccount
GO

DROP TABLE IF EXISTS jobProfile
GO

DROP TABLE IF EXISTS jobRole
GO

DROP TABLE IF EXISTS jobCategory
GO

DROP TABLE IF EXISTS jobStatus
GO



--------------- 2) table definitions
CREATE TABLE jobCategory 
(
    categoryid INT NOT NULL IDENTITY PRIMARY KEY,
    -- primary key: categoryid
    categoryname NVARCHAR(50) NOT NULL,
    categorydescription NVARCHAR(255)
)
GO

CREATE TABLE jobStatus
(
    statusid INT NOT NULL IDENTITY PRIMARY KEY,
    -- primary key: statusid
    statusname NVARCHAR(50) NOT NULL,
    statusdescription NVARCHAR(255)
)
GO


CREATE TABLE jobRole
(
    roleid INT NOT NULL IDENTITY PRIMARY KEY,
    -- primary key: roleid
    rolename NVARCHAR(50) NOT NULL,
    roledescription NVARCHAR(255)
)
GO

CREATE TABLE jobProfile
(
    profileid INT NOT NULL IDENTITY PRIMARY KEY,
    -- primary key: profileid
    firstname NVARCHAR(50) NOT NULL,
    lastname NVARCHAR(50) NOT NULL,
    phonenumber NVARCHAR(50) NOT NULL UNIQUE,
    profiledescription NVARCHAR(255),
    profilepicture NVARCHAR(255)
)
GO

CREATE TABLE jobAccount
(
    accountid INT NOT NULL IDENTITY PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    FK_profileid INT NOT NULL,
    FK_roleid INT NOT NULL DEFAULT 2,

    CONSTRAINT jobFK_Account_Profile FOREIGN KEY (FK_profileid) REFERENCES jobProfile (profileid),
    CONSTRAINT jobFK_Account_Role FOREIGN KEY (FK_roleid) REFERENCES jobRole (roleid)
)
GO

CREATE TABLE jobTask
(
    taskid INT NOT NULL IDENTITY PRIMARY KEY,
    tasktitle NVARCHAR(50) NOT NULL,
    taskdescription NVARCHAR(255) NOT NULL,
    taskaddress NVARCHAR(255) NOT NULL,
    taskpostdate BIGINT NOT NULL,
    tasksalary INT NOT NULL,
    FK_accountid INT NOT NULL,
    FK_categoryid INT NOT NULL,
    FK_statusid INT NOT NULL DEFAULT 1,

    CONSTRAINT jobFK_Task_Account FOREIGN KEY (FK_accountid) REFERENCES jobAccount (accountid),
    CONSTRAINT jobFK_Task_Category FOREIGN KEY (FK_categoryid) REFERENCES jobCategory (categoryid),
    CONSTRAINT jobFK_Task_Status FOREIGN KEY (FK_statusid) REFERENCES jobStatus (statusid),
)
GO

CREATE TABLE jobApplication
(
    FK_taskid INT NOT NULL,
    FK_accountid INT NOT NULL
   
    CONSTRAINT jobFK_Application_Task FOREIGN KEY (FK_taskid) REFERENCES jobTask (taskid),
    CONSTRAINT jobFK_Application_Account FOREIGN KEY (FK_accountid) REFERENCES jobAccount (accountid),
)
GO

CREATE TABLE jobPassword
(
    FK_accountid INT NOT NULL,
    hashedpassword NVARCHAR(255) NOT NULL

    CONSTRAINT jobFK_Password_Account FOREIGN KEY (FK_accountid) REFERENCES jobAccount (accountid)
)
GO





-------- 3) populating test data
INSERT INTO jobStatus
    ([statusname], [statusdescription])
    VALUES
    ('available', 'This task is currently open.'),
    ('expired', 'This task no lnger available.')


INSERT INTO jobCategory 
    ([categoryname], [categorydescription])
    VALUES
    ('indoor', 'Tasks that will be performed inside.'),
    ('outdoor', 'Tasks that will be performed outside.')
GO

INSERT INTO jobRole 
    ([rolename], [roledescription])
    VALUES
    ('admin', 'can add and delete all posts'),
    ('member', 'can add posts')
GO

INSERT INTO jobProfile
    ([firstname], [lastname], [phonenumber], [profiledescription], [profilepicture])
    VALUES
    ('Jan', 'Kowalski', '45892642', 'Hello bla bla bla here i am', NULL),
    ('Lili', 'Obrien', '73727722', 'I am a preffessional horse rider.', NULL),
    ('Connor', 'Yellow', '232134124', 'I am a preffessional painter.', NULL)
GO

INSERT INTO jobAccount 
    ([email], [FK_profileid], [FK_roleid])
    VALUES 
    ('ralala@gmail.com', 1, 1),
    ('blue@gmail.com', 2, 2),
    ('red@gmail.com', 3, 2)
GO

INSERT INTO jobTask
    ([tasktitle], [taskdescription], [taskaddress], [taskpostdate], [tasksalary], [FK_accountid], [FK_categoryid], [FK_statusid])
    VALUES
    ('babysitter', 'Help with the child on the 08th of September in 2022', 'Aalborg, 9000, Nytorv 1.', 1662854400000, 100, 1, 1, 1),
    ('digging', 'Dig a hole in my backyard on this Weekend.', 'Aalborg, 9300, Vesterbro 4.', 1663459200000, 120, 2, 2, 2),
    ('Car washing', 'Wash my car Tomorrow', 'Aarhus, 9300, Vesterbro 4.', 1664748000000, 200, 1, 2, 1),
    ('Painting the wall', 'I need help to paint my wall on the frist weekend of August.', 'Riga, Main street 2.', 1658700000000, 60, 1, 2, 2),
    ('Fixing my bike', 'I have a flat tyre! Need help ASAP!', 'Szeged, Lövölde út 153.', 1663711200000, 120, 2, 2, 1),
    ('Mown my backyard', 'I need someone to mown my backyard', 'Aalborg, Hobrovej 9400', 1664775200000, 125, 2, 1, 1),
    ('Washing my Range Rover', 'My car is very dirty, can you clean it until Tuesday?', 'Aalborg, Norresundby', 1664775200000, 254,  2, 1, 2)
GO

INSERT INTO jobPassword 
    ([FK_accountid], [hashedpassword])
    VALUES
    (1, '$2a$13$Q2jY.Mj2BDR1cXCuw3.8XuaoacsCg/5qtTmwt66AeNsSJLd/qEBPO'),
    (2, '$2a$13$NMHMd75HwjKB2H2oumBQdurBTFfnrHy.pQnv/lrUcqIWuwODZU8QG'),
    (3, '$2a$13$NMHMd75HwjKB2H2oumBQdurBTFfnrHy.pQnv/lrUcqIWuwODZU8QG')
GO
INSERT INTO jobApplication 
    ([FK_taskid], [FK_accountid])
    VALUES
    (1, 2),
    (1, 3)
GO
-- Passwords: 
-- (1, cat)
-- (2, dog)



---------- 4) verifying the database
SELECT * FROM jobAccount a 
    INNER JOIN jobPassword p
    ON a.accountid = p.FK_accountid
        INNER JOIN jobProfile pr 
        ON a.FK_profileid = pr.profileid
            INNER JOIN jobTask t
            ON t.FK_accountid = a.accountid
                INNER JOIN jobRole r 
                ON a.FK_roleid = r.roleid
                INNER JOIN jobCategory c
                ON t.FK_categoryid = c.categoryid
                INNER JOIN jobStatus s 
                ON t.FK_statusid = s.statusid
                ORDER BY a.accountid
GO

