USE [WAD-MMD-CSD-S21_10407745]
GO

-- SELECT *
-- FROM jobProfile p 
--     INNER JOIN jobAccount a 
--     ON p.profileid = a.FK_profileid
-- GO

-- SELECT *
-- FROM jobRole
-- GO

-- SELECT * FROM jobAccount ja
-- INNER JOIN jobRole jr
-- ON ja.FK_roleid = jr.roleid

-- GO

-- SELECT * FROM jobAccount a
--  INNER JOIN jobProfile pr
--  pr.profileid = a.FK_profileid


SELECT * FROM jobTask 
SELECT * FROM jobApplication ap
--  INNER JOIN jobAccount a
--  ON ap.FK_accountid = a.accountid
--  INNER JOIN jobProfile pr
--  ON pr.profileid = a.FK_profileid
--   WHERE ap.FK_taskid = 1
