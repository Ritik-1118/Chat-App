import React, { useState, useContext, useEffect } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { user, login } = useContext(AuthContext);

  const formik = useFormik({
    initialValues: {
      username: "",
      password: ""
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      const { username, password } = values;
      const res = await login(username, password);
      if (res.error || res.data) {
        if (res.data && res.data.detail) {
          setError(res.data.detail);
        }
      } else {
        navigate("/");
      }
      setSubmitting(false);
    }
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md py-4 border rounded bg-gray-400">
        <div className="flex justify-center">
          <h1 className="mt-4 text-3xl text-center font-extrabold text-gray-900">Sign in to your account</h1>
        </div>
        <div className="flex justify-center mt-2">
          <hr className="w-full mx-10 border-b-2 border-blue-500" />
        </div>

        <form className="mt-8 px-10" onSubmit={formik.handleSubmit}>
          {error && <div>{JSON.stringify(error)}</div>}

          <div className="rounded-md">
            <input
              value={formik.values.username}
              onChange={formik.handleChange}
              type="text"
              name="username"
              placeholder="Username"
              className="py-3 border-gray-300 text-gray-900 placeholder-gray-300 focus:ring-gray-500 focus:border-gray-500 block w-full px-4 focus:outline-none sm:text-sm rounded-md mb-4 text-3xl"
            />
            <input
              value={formik.values.password}
              onChange={formik.handleChange}
              type="password"
              name="password"
              className="py-3 border-gray-300 text-gray-900 placeholder-gray-300 focus:ring-gray-500 focus:border-gray-500 block w-full px-4 focus:outline-none sm:text-sm rounded-md mb-4 text-3xl"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-sky-600 py-2 px-5 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            {formik.isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}