CREATE SCHEMA IF NOT EXISTS `vouchers`;

CREATE TABLE IF NOT EXISTS `vouchers`.`codes` (
  `code` varchar(50) NOT NULL,
  `startDate` datetime DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  PRIMARY KEY (`code`),
  UNIQUE KEY `code_UNIQUE` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vouchers`.`codes_to_brands` (
  `brandId` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  PRIMARY KEY (`code`),
  KEY `voucher_code` (`code`),
  CONSTRAINT `fk_codes_to_brands_1` FOREIGN KEY (`code`) REFERENCES `codes` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

