using Microsoft.AspNetCore.Mvc;
using Crux.Models.EntityTypes;
using Crux.Models.Responses;
using Crux.Models.Requests;
using Crux.Services;

namespace Crux.Controllers;

[Route("question")]
public class QuestionController (IAuthenticationService authenticationService, IQuestionService questionService) : ControllerBase
{
    [HttpPost("create-question")]
    public async Task<ActionResult<Response>> CreateQuestionAsync([FromBody] QuestionRequest questionRequest)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = await questionService.AddQuestionAsync(questionRequest);

            return new ControllerResponse<QuestionResponse>
            {
                Success = true,
                Body = response
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
    
    [HttpPut("update-question")]
    public async Task<ActionResult<Response>> UpdateQuestionAsync([FromBody] QuestionRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await questionService.UpdateQuestionAsync(request);

            return new ControllerResponse<QuestionResponse>
            {
                Success = true,
                Body = response
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
    
    [HttpDelete("delete-question/{id:int}")]
    public async Task<ActionResult<Response>> DeleteQuestion(int id)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await questionService.DeleteQuestionAsync(id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
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
