using Crux.Data;
using Crux.Models;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("[controller]")]
public class UserController
{
    private static ApplicationDbContext _dbContext;

    public static void SetDbContext(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    // Might need some upgrades :D

    [HttpPost("signup")]

    public ControllerResponse SignUp([FromBody] UserSignUpRequest request)
    {
        try
        {
            var user = new User
            {
                Email = request.Email,
                Password = request.Password, // consider adding hasher at some point
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            if (_dbContext.Users.Any(u => u.Email == user.Email))
            {
                return ControllerResponse.CreateError("User with this email already exists!");
            }
            
            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();
            
            // After implementing SignIn(), consider signing in user right after approving sign up
            return ControllerResponse.CreateSuccess($"Successfully created user #{user.Id}!");
        }
        catch (Exception ex)
        {
            return ControllerResponse.CreateError($"An error occurred: {ex.Message}");
        }
    }

    [HttpPost("signin")]
    public ControllerResponse SingIn([FromBody] UserSignInRequest request)
    {
        try
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
            {
                return ControllerResponse.CreateError("User does not exist");
            }

            if (user.Password != request.Password)
            {
                return ControllerResponse.CreateError("Wrong password");   
            }
            

            return ControllerResponse.CreateSuccess($"Signed in successfully, User #{user.Id}");

        }
        catch (Exception ex)
        {
            return ControllerResponse.CreateError($"An error occured: {ex.Message}");
        }
    }

    // TODO: write routes for signing in / signing out / checking authorization...
    // TODO: consider using JWT tokens and creating authentication service
}