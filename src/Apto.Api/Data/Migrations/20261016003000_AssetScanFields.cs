using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apto.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AssetScanFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AptoId",
                table: "Assets",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "Assets",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LocationId",
                table: "Assets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Assets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql(
                """
                ;WITH ordered AS (
                    SELECT Id, ROW_NUMBER() OVER (ORDER BY CreatedAtUtc) AS rn
                    FROM Assets
                    WHERE AptoId IS NULL OR AptoId = ''
                )
                UPDATE a
                SET AptoId = 'A' + RIGHT('0000000' + CAST(o.rn AS VARCHAR(7)), 7)
                FROM Assets a
                INNER JOIN ordered o ON a.Id = o.Id;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "AptoId",
                table: "Assets",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AptoIdSequences",
                columns: table => new
                {
                    Id = table.Column<byte>(type: "tinyint", nullable: false),
                    NextNumber = table.Column<int>(type: "int", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AptoIdSequences", x => x.Id);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO AptoIdSequences (Id, NextNumber)
                SELECT CAST(1 AS tinyint), COUNT(*) + 1 FROM Assets;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_AptoId",
                table: "Assets",
                column: "AptoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets",
                column: "SerialNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_LocationId",
                table: "Assets",
                column: "LocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_ReferenceItems_LocationId",
                table: "Assets",
                column: "LocationId",
                principalTable: "ReferenceItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_ReferenceItems_LocationId",
                table: "Assets");

            migrationBuilder.DropTable(
                name: "AptoIdSequences");

            migrationBuilder.DropIndex(
                name: "IX_Assets_LocationId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_SerialNumber",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_AptoId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "AptoId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "LocationId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Assets");
        }
    }
}
