START TRANSACTION;

-- Insert 50 addresses
INSERT INTO vidhila_db_test.m_address
(address_id, created_at, delete_flag, deleted_at, updated_at, created_by, deleted_by, updated_by, city, country, country_code, lang, other, region, state, state_code, street, zip, tenant_id)
VALUES
(1001, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_1', 'India', 'IN', 'EN', 'Address_Other_1', 'Region_1', 'State_1', 'ST01', 'Street_1', '600001', 1),
(1002, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_2', 'India', 'IN', 'EN', 'Address_Other_2', 'Region_2', 'State_2', 'ST02', 'Street_2', '600002', 1),
(1003, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_3', 'India', 'IN', 'EN', 'Address_Other_3', 'Region_3', 'State_3', 'ST03', 'Street_3', '600003', 1),
(1004, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_4', 'India', 'IN', 'EN', 'Address_Other_4', 'Region_4', 'State_4', 'ST04', 'Street_4', '600004', 1),
(1005, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_5', 'India', 'IN', 'EN', 'Address_Other_5', 'Region_5', 'State_5', 'ST05', 'Street_5', '600005', 1),
(1006, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_6', 'India', 'IN', 'EN', 'Address_Other_6', 'Region_6', 'State_6', 'ST06', 'Street_6', '600006', 1),
(1007, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_7', 'India', 'IN', 'EN', 'Address_Other_7', 'Region_7', 'State_7', 'ST07', 'Street_7', '600007', 1),
(1008, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_8', 'India', 'IN', 'EN', 'Address_Other_8', 'Region_8', 'State_8', 'ST08', 'Street_8', '600008', 1),
(1009, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_9', 'India', 'IN', 'EN', 'Address_Other_9', 'Region_9', 'State_9', 'ST09', 'Street_9', '600009', 1),
(1010, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_10', 'India', 'IN', 'EN', 'Address_Other_10', 'Region_10', 'State_10', 'ST10', 'Street_10', '600010', 1),
(1011, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_11', 'India', 'IN', 'EN', 'Address_Other_11', 'Region_11', 'State_11', 'ST11', 'Street_11', '600011', 1),
(1012, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_12', 'India', 'IN', 'EN', 'Address_Other_12', 'Region_12', 'State_12', 'ST12', 'Street_12', '600012', 1),
(1013, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_13', 'India', 'IN', 'EN', 'Address_Other_13', 'Region_13', 'State_13', 'ST13', 'Street_13', '600013', 1),
(1014, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_14', 'India', 'IN', 'EN', 'Address_Other_14', 'Region_14', 'State_14', 'ST14', 'Street_14', '600014', 1),
(1015, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_15', 'India', 'IN', 'EN', 'Address_Other_15', 'Region_15', 'State_15', 'ST15', 'Street_15', '600015', 1),
(1016, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_16', 'India', 'IN', 'EN', 'Address_Other_16', 'Region_16', 'State_16', 'ST16', 'Street_16', '600016', 1),
(1017, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_17', 'India', 'IN', 'EN', 'Address_Other_17', 'Region_17', 'State_17', 'ST17', 'Street_17', '600017', 1),
(1018, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_18', 'India', 'IN', 'EN', 'Address_Other_18', 'Region_18', 'State_18', 'ST18', 'Street_18', '600018', 1),
(1019, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_19', 'India', 'IN', 'EN', 'Address_Other_19', 'Region_19', 'State_19', 'ST19', 'Street_19', '600019', 1),
(1020, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_20', 'India', 'IN', 'EN', 'Address_Other_20', 'Region_20', 'State_20', 'ST20', 'Street_20', '600020', 1),
(1021, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_21', 'India', 'IN', 'EN', 'Address_Other_21', 'Region_21', 'State_21', 'ST21', 'Street_21', '600021', 1),
(1022, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_22', 'India', 'IN', 'EN', 'Address_Other_22', 'Region_22', 'State_22', 'ST22', 'Street_22', '600022', 1),
(1023, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_23', 'India', 'IN', 'EN', 'Address_Other_23', 'Region_23', 'State_23', 'ST23', 'Street_23', '600023', 1),
(1024, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_24', 'India', 'IN', 'EN', 'Address_Other_24', 'Region_24', 'State_24', 'ST24', 'Street_24', '600024', 1),
(1025, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_25', 'India', 'IN', 'EN', 'Address_Other_25', 'Region_25', 'State_25', 'ST25', 'Street_25', '600025', 1),
(1026, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_26', 'India', 'IN', 'EN', 'Address_Other_26', 'Region_26', 'State_26', 'ST26', 'Street_26', '600026', 1),
(1027, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_27', 'India', 'IN', 'EN', 'Address_Other_27', 'Region_27', 'State_27', 'ST27', 'Street_27', '600027', 1),
(1028, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_28', 'India', 'IN', 'EN', 'Address_Other_28', 'Region_28', 'State_28', 'ST28', 'Street_28', '600028', 1),
(1029, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_29', 'India', 'IN', 'EN', 'Address_Other_29', 'Region_29', 'State_29', 'ST29', 'Street_29', '600029', 1),
(1030, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_30', 'India', 'IN', 'EN', 'Address_Other_30', 'Region_30', 'State_30', 'ST30', 'Street_30', '600030', 1),
(1031, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_31', 'India', 'IN', 'EN', 'Address_Other_31', 'Region_31', 'State_31', 'ST31', 'Street_31', '600031', 1),
(1032, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_32', 'India', 'IN', 'EN', 'Address_Other_32', 'Region_32', 'State_32', 'ST32', 'Street_32', '600032', 1),
(1033, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_33', 'India', 'IN', 'EN', 'Address_Other_33', 'Region_33', 'State_33', 'ST33', 'Street_33', '600033', 1),
(1034, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_34', 'India', 'IN', 'EN', 'Address_Other_34', 'Region_34', 'State_34', 'ST34', 'Street_34', '600034', 1),
(1035, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_35', 'India', 'IN', 'EN', 'Address_Other_35', 'Region_35', 'State_35', 'ST35', 'Street_35', '600035', 1),
(1036, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_36', 'India', 'IN', 'EN', 'Address_Other_36', 'Region_36', 'State_36', 'ST36', 'Street_36', '600036', 1),
(1037, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_37', 'India', 'IN', 'EN', 'Address_Other_37', 'Region_37', 'State_37', 'ST37', 'Street_37', '600037', 1),
(1038, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_38', 'India', 'IN', 'EN', 'Address_Other_38', 'Region_38', 'State_38', 'ST38', 'Street_38', '600038', 1),
(1039, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_39', 'India', 'IN', 'EN', 'Address_Other_39', 'Region_39', 'State_39', 'ST39', 'Street_39', '600039', 1),
(1040, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_40', 'India', 'IN', 'EN', 'Address_Other_40', 'Region_40', 'State_40', 'ST40', 'Street_40', '600040', 1),
(1041, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_41', 'India', 'IN', 'EN', 'Address_Other_41', 'Region_41', 'State_41', 'ST41', 'Street_41', '600041', 1),
(1042, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_42', 'India', 'IN', 'EN', 'Address_Other_42', 'Region_42', 'State_42', 'ST42', 'Street_42', '600042', 1),
(1043, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_43', 'India', 'IN', 'EN', 'Address_Other_43', 'Region_43', 'State_43', 'ST43', 'Street_43', '600043', 1),
(1044, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_44', 'India', 'IN', 'EN', 'Address_Other_44', 'Region_44', 'State_44', 'ST44', 'Street_44', '600044', 1),
(1045, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_45', 'India', 'IN', 'EN', 'Address_Other_45', 'Region_45', 'State_45', 'ST45', 'Street_45', '600045', 1),
(1046, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_46', 'India', 'IN', 'EN', 'Address_Other_46', 'Region_46', 'State_46', 'ST46', 'Street_46', '600046', 1),
(1047, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_47', 'India', 'IN', 'EN', 'Address_Other_47', 'Region_47', 'State_47', 'ST47', 'Street_47', '600047', 1),
(1048, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_48', 'India', 'IN', 'EN', 'Address_Other_48', 'Region_48', 'State_48', 'ST48', 'Street_48', '600048', 1),
(1049, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_49', 'India', 'IN', 'EN', 'Address_Other_49', 'Region_49', 'State_49', 'ST49', 'Street_49', '600049', 1),
(1050, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'City_50', 'India', 'IN', 'EN', 'Address_Other_50', 'Region_50', 'State_50', 'ST50', 'Street_50', '600050', 1);

-- Insert 25 contacts
INSERT INTO vidhila_db_test.m_contact
(contact_id, created_at, delete_flag, deleted_at, updated_at, created_by, deleted_by, updated_by, archived, company_name, department, email1, email2, first_name, job_title, last_name, phone1, phone2, tenant_id, website1, website2, address1_id, address2_id)
VALUES
(2001, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_1', 'Department_1', 'contact1@example.com', 'alt1@example.com', 'FirstName_1', 'JobTitle_1', 'LastName_1', '+91-9000001', '+91-8000001', 1, 'https://company1.example.com', 'https://profile1.example.com', 1001, 1002),
(2002, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_2', 'Department_2', 'contact2@example.com', 'alt2@example.com', 'FirstName_2', 'JobTitle_2', 'LastName_2', '+91-9000002', '+91-8000002', 1, 'https://company2.example.com', 'https://profile2.example.com', 1003, 1004),
(2003, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_3', 'Department_3', 'contact3@example.com', 'alt3@example.com', 'FirstName_3', 'JobTitle_3', 'LastName_3', '+91-9000003', '+91-8000003', 1, 'https://company3.example.com', 'https://profile3.example.com', 1005, 1006),
(2004, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_4', 'Department_4', 'contact4@example.com', 'alt4@example.com', 'FirstName_4', 'JobTitle_4', 'LastName_4', '+91-9000004', '+91-8000004', 1, 'https://company4.example.com', 'https://profile4.example.com', 1007, 1008),
(2005, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_5', 'Department_5', 'contact5@example.com', 'alt5@example.com', 'FirstName_5', 'JobTitle_5', 'LastName_5', '+91-9000005', '+91-8000005', 1, 'https://company5.example.com', 'https://profile5.example.com', 1009, 1010),
(2006, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_6', 'Department_6', 'contact6@example.com', 'alt6@example.com', 'FirstName_6', 'JobTitle_6', 'LastName_6', '+91-9000006', '+91-8000006', 1, 'https://company6.example.com', 'https://profile6.example.com', 1011, 1012),
(2007, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_7', 'Department_7', 'contact7@example.com', 'alt7@example.com', 'FirstName_7', 'JobTitle_7', 'LastName_7', '+91-9000007', '+91-8000007', 1, 'https://company7.example.com', 'https://profile7.example.com', 1013, 1014),
(2008, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_8', 'Department_8', 'contact8@example.com', 'alt8@example.com', 'FirstName_8', 'JobTitle_8', 'LastName_8', '+91-9000008', '+91-8000008', 1, 'https://company8.example.com', 'https://profile8.example.com', 1015, 1016),
(2009, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_9', 'Department_9', 'contact9@example.com', 'alt9@example.com', 'FirstName_9', 'JobTitle_9', 'LastName_9', '+91-9000009', '+91-8000009', 1, 'https://company9.example.com', 'https://profile9.example.com', 1017, 1018),
(2010, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_10', 'Department_10', 'contact10@example.com', 'alt10@example.com', 'FirstName_10', 'JobTitle_10', 'LastName_10', '+91-9000010', '+91-8000010', 1, 'https://company10.example.com', 'https://profile10.example.com', 1019, 1020),
(2011, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_11', 'Department_11', 'contact11@example.com', 'alt11@example.com', 'FirstName_11', 'JobTitle_11', 'LastName_11', '+91-9000011', '+91-8000011', 1, 'https://company11.example.com', 'https://profile11.example.com', 1021, 1022),
(2012, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_12', 'Department_12', 'contact12@example.com', 'alt12@example.com', 'FirstName_12', 'JobTitle_12', 'LastName_12', '+91-9000012', '+91-8000012', 1, 'https://company12.example.com', 'https://profile12.example.com', 1023, 1024),
(2013, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_13', 'Department_13', 'contact13@example.com', 'alt13@example.com', 'FirstName_13', 'JobTitle_13', 'LastName_13', '+91-9000013', '+91-8000013', 1, 'https://company13.example.com', 'https://profile13.example.com', 1025, 1026),
(2014, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_14', 'Department_14', 'contact14@example.com', 'alt14@example.com', 'FirstName_14', 'JobTitle_14', 'LastName_14', '+91-9000014', '+91-8000014', 1, 'https://company14.example.com', 'https://profile14.example.com', 1027, 1028),
(2015, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_15', 'Department_15', 'contact15@example.com', 'alt15@example.com', 'FirstName_15', 'JobTitle_15', 'LastName_15', '+91-9000015', '+91-8000015', 1, 'https://company15.example.com', 'https://profile15.example.com', 1029, 1030),
(2016, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_16', 'Department_16', 'contact16@example.com', 'alt16@example.com', 'FirstName_16', 'JobTitle_16', 'LastName_16', '+91-9000016', '+91-8000016', 1, 'https://company16.example.com', 'https://profile16.example.com', 1031, 1032),
(2017, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_17', 'Department_17', 'contact17@example.com', 'alt17@example.com', 'FirstName_17', 'JobTitle_17', 'LastName_17', '+91-9000017', '+91-8000017', 1, 'https://company17.example.com', 'https://profile17.example.com', 1033, 1034),
(2018, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_18', 'Department_18', 'contact18@example.com', 'alt18@example.com', 'FirstName_18', 'JobTitle_18', 'LastName_18', '+91-9000018', '+91-8000018', 1, 'https://company18.example.com', 'https://profile18.example.com', 1035, 1036),
(2019, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_19', 'Department_19', 'contact19@example.com', 'alt19@example.com', 'FirstName_19', 'JobTitle_19', 'LastName_19', '+91-9000019', '+91-8000019', 1, 'https://company19.example.com', 'https://profile19.example.com', 1037, 1038),
(2020, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_20', 'Department_20', 'contact20@example.com', 'alt20@example.com', 'FirstName_20', 'JobTitle_20', 'LastName_20', '+91-9000020', '+91-8000020', 1, 'https://company20.example.com', 'https://profile20.example.com', 1039, 1040),
(2021, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_21', 'Department_21', 'contact21@example.com', 'alt21@example.com', 'FirstName_21', 'JobTitle_21', 'LastName_21', '+91-9000021', '+91-8000021', 1, 'https://company21.example.com', 'https://profile21.example.com', 1041, 1042),
(2022, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_22', 'Department_22', 'contact22@example.com', 'alt22@example.com', 'FirstName_22', 'JobTitle_22', 'LastName_22', '+91-9000022', '+91-8000022', 1, 'https://company22.example.com', 'https://profile22.example.com', 1043, 1044),
(2023, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_23', 'Department_23', 'contact23@example.com', 'alt23@example.com', 'FirstName_23', 'JobTitle_23', 'LastName_23', '+91-9000023', '+91-8000023', 1, 'https://company23.example.com', 'https://profile23.example.com', 1045, 1046),
(2024, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_24', 'Department_24', 'contact24@example.com', 'alt24@example.com', 'FirstName_24', 'JobTitle_24', 'LastName_24', '+91-9000024', '+91-8000024', 1, 'https://company24.example.com', 'https://profile24.example.com', 1047, 1048),
(2025, NOW(6), 0, NULL, NOW(6), 1, NULL, 1, 'N', 'Company_25', 'Department_25', 'contact25@example.com', 'alt25@example.com', 'FirstName_25', 'JobTitle_25', 'LastName_25', '+91-9000025', '+91-8000025', 1, 'https://company25.example.com', 'https://profile25.example.com', 1049, 1050);

COMMIT;



