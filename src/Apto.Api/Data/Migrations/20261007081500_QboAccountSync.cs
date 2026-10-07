using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apto.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class QboAccountSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QboCustomerId",
                table: "Accounts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QboSyncError",
                table: "Accounts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QboSyncStatus",
                table: "Accounts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "skipped");

            migrationBuilder.CreateTable(
                name: "QboConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    RealmId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AccessToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccessTokenExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QboConnections", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QboConnections");

            migrationBuilder.DropColumn(
                name: "QboCustomerId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "QboSyncError",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "QboSyncStatus",
                table: "Accounts");
        }
    }
}
