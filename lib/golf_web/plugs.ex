defmodule GolfWeb.Plugs do
  import Plug.Conn

  def unique_session_id() do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16()
  end

  def put_session_id(conn, _opts) do
    case get_session(conn, :session_id) do
      nil ->
        session_id = unique_session_id()

        conn
        |> assign(:session_id, session_id)
        |> put_session(:session_id, session_id)

      session_id ->
        assign(conn, :session_id, session_id)
    end
  end

  def put_user(conn, _opts) do
    case Golf.Users.get_user(conn.assigns.session_id) do
      nil ->
        user_attrs = %{
          id: conn.assigns.session_id,
          name: Golf.Users.default_username()
        }

        {:ok, user} = Golf.Users.create_user(user_attrs)
        assign(conn, :user, user)

      user ->
        assign(conn, :user, user)
    end
  end
end
