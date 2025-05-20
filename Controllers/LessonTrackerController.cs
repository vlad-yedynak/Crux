using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("tracker")]
public class LessonTrackerController(
    IAuthenticationService authenticationService,
    ILessonTrackerService trackerService) : ControllerBase
{
    // TODO: Implement routes for existing service methods
}
