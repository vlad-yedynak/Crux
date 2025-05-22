using Crux.Models.Requests;
using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("test")]
public class TestController(
    IAuthenticationService authenticationService,
    ITestService testService) : ControllerBase
{
    [HttpPost("validate-question")]
    public async Task<ActionResult<Response>> ValidateQuestionAsync([FromBody] ValidateQuestionRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var isCorrect = await testService.ValidateQuestionAsync(userId.Value, request.QuestionId , request.AnswerId);
            
            return new ControllerResponse<bool>
            {
                Success = true,
                Body = isCorrect
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }

    [HttpPost("validate-task")]
    public async Task<ActionResult<Response>> ValidateTaskAsync([FromBody] ValidateTaskRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var isCorrect = await testService.ValidateTaskAsync(userId.Value, request.TaskId , request.InputData);

            return new ControllerResponse<bool>
            {
                Success = true,
                Body = isCorrect
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
}
