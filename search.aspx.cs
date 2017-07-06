using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Text;
using System.Net;
using System.IO;

public partial class Search : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        var data = new object[] {
            new {
                hits = new object[] {
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    },
                    new {
                        id = 46,
                        title = "Badplats 777"
                    }
                },
                layername = "badplats",
                numberOfHits = 1
            },
            new {
                hits = new object[] {
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    },
                    new {
                        id = 25701,
                        title = "Vagnat 25701"
                    }
                },
                layername = "vagnat",
                numberOfHits = 1
            }
        };

        System.Web.Script.Serialization.JavaScriptSerializer serializer = new System.Web.Script.Serialization.JavaScriptSerializer();
        Response.Clear();
        Response.ContentType = "application/json; charset=UTF-8";
        Response.Write(serializer.Serialize(data));
        Response.End();
    }
}
