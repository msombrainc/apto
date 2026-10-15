using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Apto.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReferenceItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Categories",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "ReferenceItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ParentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Group = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    CertificateGroup = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferenceItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferenceItems_ReferenceItems_ParentId",
                        column: x => x.ParentId,
                        principalTable: "ReferenceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceItems_Type_Code",
                table: "ReferenceItems",
                columns: new[] { "Type", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceItems_Type_ParentId_Code",
                table: "ReferenceItems",
                columns: new[] { "Type", "ParentId", "Code" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferenceItems");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Categories");
        }
    }
}
