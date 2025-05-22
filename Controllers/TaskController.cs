using Microsoft.AspNetCore.Mvc;
using Crux.Models.EntityTypes;
using Crux.Models.Responses;
using Crux.Models.Requests;
using Crux.Services;

namespace Crux.Controllers;

[Route("task")]
public class TaskController (IAuthenticationService authenticationService, ITaskService taskService) : ControllerBase
{
    [HttpPost("create-task")]
    public async Task<ActionResult<Response>> CreateTaskAsync([FromBody] TaskRequest taskRequest)
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

            var response = await taskService.AddTaskAsync(taskRequest);

            return new ControllerResponse<TaskResponse>
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
    
    [HttpPut("update-task")]
    public async Task<ActionResult<Response>> UpdateTaskAsync([FromBody] TaskRequest request)
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
            
            var response = await taskService.UpdateTaskAsync(request);

            return new ControllerResponse<TaskResponse>
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
    
    [HttpDelete("delete-task/{id:int}")]
    public async Task<ActionResult<Response>> DeleteTaskAsync(int id)
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
            
            var response = await taskService.DeleteTaskAsync(id);

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
