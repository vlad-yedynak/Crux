using Crux.Data;
using Crux.Models;
using Crux.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using MySql.EntityFrameworkCore.Extensions;

Env.Load();

var connectionString = Environment.GetEnvironmentVariable("APP_DB_CONNECTION_STRING");
if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("DB connection string not found");
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddDbContext<ApplicationDbContext>();
builder.Services.AddMySQLServer<ApplicationDbContext>(connectionString);
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IApplicationUserService, ApplicationUserService>();
builder.Services.AddScoped<IApplicationAuthService, ApplicationAuthService>();

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCors(option => option.WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseAuthorization();
app.UseAuthentication();

app.MapControllers();

app.MapGet("/", () => "Цьомчик");

app.Run();
